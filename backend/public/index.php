<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use Nyholm\Psr7\Factory\Psr17Factory;
use Nyholm\Psr7Server\ServerRequestCreator;
use App\Middleware\TenantSecurityMiddleware;
use App\Repository\OrderRepository;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Psr\Http\Message\ResponseFactoryInterface;

// 1. Create PSR-17 Factories
$psr17Factory = new Psr17Factory();

// 2. Simple PSR-17 ResponseFactoryInterface implementation
class SimpleResponseFactory implements ResponseFactoryInterface
{
    private Psr17Factory $factory;

    public function __construct(Psr17Factory $factory)
    {
        $this->factory = $factory;
    }

    public function createResponse(int $code = 200, string $reasonPhrase = ''): ResponseInterface
    {
        return $this->factory->createResponse($code, $reasonPhrase);
    }
}

// 3. Setup PDO connection
$dbHost = getenv('DB_HOST') ?: '127.0.0.1';
$dbPort = getenv('DB_PORT') ?: '5432';
$dbName = getenv('DB_NAME') ?: 'marketplace';
$dbUser = getenv('DB_USER') ?: 'postgres';
$dbPass = getenv('DB_PASSWORD') ?: '';

// Try reading password from file if secret path is provided
$dbPassFile = getenv('DB_PASSWORD_FILE');
if ($dbPassFile && file_exists($dbPassFile)) {
    $dbPass = trim(file_get_contents($dbPassFile));
}

try {
    $dsn = "pgsql:host={$dbHost};port={$dbPort};dbname={$dbName}";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (\Throwable $e) {
    header('HTTP/1.1 500 Internal Server Error');
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Database connection failed',
        'message' => $e->getMessage()
    ]);
    exit;
}

// 4. Create request handler
class MainRequestHandler implements RequestHandlerInterface
{
    private PDO $pdo;
    private Psr17Factory $responseFactory;

    public function __construct(PDO $pdo, Psr17Factory $responseFactory)
    {
        $this->pdo = $pdo;
        $this->responseFactory = $responseFactory;
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $path = $request->getUri()->getPath();
        $response = $this->responseFactory->createResponse(200)
            ->withHeader('Content-Type', 'application/json')
            ->withHeader('Access-Control-Allow-Origin', '*')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, X-Tenant-ID')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

        // Handle OPTIONS request for CORS preflight
        if ($request->getMethod() === 'OPTIONS') {
            return $response;
        }

        if ($path === '/api/orders') {
            $repo = new OrderRepository($this->pdo);
            $orders = $repo->findAll();
            $data = array_map(fn($order) => $order->toArray(), $orders);

            $response->getBody()->write(json_encode([
                'tenant_id' => $request->getAttribute('tenant_id'),
                'orders' => $data
            ], JSON_THROW_ON_ERROR));

            return $response;
        }

        if ($path === '/api/health') {
            $response->getBody()->write(json_encode([
                'status' => 'healthy',
                'database' => 'connected'
            ]));
            return $response;
        }

        // 404
        $notFoundResponse = $this->responseFactory->createResponse(404)
            ->withHeader('Content-Type', 'application/json');
        $notFoundResponse->getBody()->write(json_encode([
            'error' => 'Not Found',
            'message' => "Route {$path} not found."
        ]));
        return $notFoundResponse;
    }
}

// 5. Create Server Request from globals
$creator = new ServerRequestCreator($psr17Factory, $psr17Factory, $psr17Factory, $psr17Factory);
$request = $creator->fromGlobals();

// 6. Execute middleware stack
$responseFactoryWrapper = new SimpleResponseFactory($psr17Factory);
$middleware = new TenantSecurityMiddleware($pdo, $responseFactoryWrapper);
$handler = new MainRequestHandler($pdo, $psr17Factory);

// If the path is /api/health, we bypass the TenantSecurityMiddleware for health checks
if ($request->getUri()->getPath() === '/api/health' || $request->getMethod() === 'OPTIONS') {
    $response = $handler->handle($request);
} else {
    $response = $middleware->process($request, $handler);
}

// 7. Output Response
if (!headers_sent()) {
    header(sprintf(
        'HTTP/%s %s %s',
        $response->getProtocolVersion(),
        $response->getStatusCode(),
        $response->getReasonPhrase()
    ), true, $response->getStatusCode());

    foreach ($response->getHeaders() as $name => $values) {
        foreach ($values as $value) {
            header(sprintf('%s: %s', $name, $value), false);
        }
    }
}

echo $response->getBody();
