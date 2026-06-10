<?php

declare(strict_types=1);

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Yiisoft\Response\ResponseFactoryInterface;
use PDO;
use RuntimeException;
use InvalidArgumentException;

/**
 * TenantSecurityMiddleware intercepts requests, extracts the tenant unique identifier
 * from verified JWT claims or custom headers, and binds it safely to the session context of the
 * active PostgreSQL database connection for RLS enforcement.
 */
final class TenantSecurityMiddleware implements MiddlewareInterface
{
    private PDO $pdo;
    private ResponseFactoryInterface $responseFactory;

    private const TENANT_HEADER = 'X-Tenant-ID';

    public function __construct(PDO $pdo, ResponseFactoryInterface $responseFactory)
    {
        $this->pdo = $pdo;
        $this->responseFactory = $responseFactory;
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        // 1. Extract tenant ID from custom header or verified token attributes
        // In a production JWT setup, this would be extracted from decrypted token attributes:
        // $tenantId = $request->getAttribute('token')?->getClaim('tenant_id');
        
        $tenantId = $request->getHeaderLine(self::TENANT_HEADER);

        if (empty($tenantId)) {
            $response = $this->responseFactory->createResponse(400);
            $response->getBody()->write(json_encode([
                'error' => 'Bad Request',
                'message' => 'Tenant identification header is missing.'
            ], JSON_THROW_ON_ERROR));
            return $response->withHeader('Content-Type', 'application/json');
        }

        // Validate UUID structure to prevent SQL/Command injections
        if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $tenantId)) {
            $response = $this->responseFactory->createResponse(400);
            $response->getBody()->write(json_encode([
                'error' => 'Bad Request',
                'message' => 'Invalid tenant format.'
            ], JSON_THROW_ON_ERROR));
            return $response->withHeader('Content-Type', 'application/json');
        }

        try {
            // 2. Bind the validated tenant ID to the PostgreSQL session context
            // Using SET LOCAL within a transaction ensures it only persists for the lifetime of this transaction.
            if (!$this->pdo->inTransaction()) {
                $this->pdo->beginTransaction();
            }

            // Bind app.current_tenant_id variable safely using query parameter binding
            $stmt = $this->pdo->prepare('SET LOCAL app.current_tenant_id = :tenant_id');
            $stmt->execute(['tenant_id' => $tenantId]);

            // 3. Inject Tenant context into request attributes for downstream domain service layers
            $request = $request->withAttribute('tenant_id', $tenantId);

            $response = $handler->handle($request);

            // Commit the transaction to apply operations and release connection settings cleanly
            if ($this->pdo->inTransaction()) {
                $this->pdo->commit();
            }

            return $response;
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }

            $response = $this->responseFactory->createResponse(500);
            $response->getBody()->write(json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to initialize tenant database context.'
            ], JSON_THROW_ON_ERROR));
            return $response->withHeader('Content-Type', 'application/json');
        }
    }
}
