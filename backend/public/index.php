<?php

declare(strict_types=1);

// Load environment variables from .env file
$envPaths = [
    __DIR__ . '/../../.env',
    __DIR__ . '/../.env'
];
foreach ($envPaths as $envPath) {
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || str_starts_with($line, '#')) {
                continue;
            }
            if (strpos($line, '=') !== false) {
                list($name, $value) = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value);
                // Strip quotes if wrapped
                if (str_starts_with($value, '"') && str_ends_with($value, '"')) {
                    $value = substr($value, 1, -1);
                } elseif (str_starts_with($value, "'") && str_ends_with($value, "'")) {
                    $value = substr($value, 1, -1);
                }
                putenv(sprintf('%s=%s', $name, $value));
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
        break;
    }
}

require_once __DIR__ . '/../vendor/autoload.php';

use Nyholm\Psr7\Factory\Psr17Factory;
use Nyholm\Psr7Server\ServerRequestCreator;
use App\Middleware\TenantSecurityMiddleware;
use App\Repository\OrderRepository;
use App\Repository\ProductRepository;
use App\Repository\TenantRepository;
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
$dbPass = getenv('DB_PASSWORD') ?: 'secretpassword';

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
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');

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

        if ($path === '/api/products') {
            $repo = new ProductRepository($this->pdo);

            if ($request->getMethod() === 'POST') {
                $tenantId = $request->getAttribute('tenant_id');
                $body = json_decode((string)$request->getBody(), true);
                
                if (empty($body['name']) || empty($body['price']) || empty($body['category'])) {
                    $errorResponse = $this->responseFactory->createResponse(400)
                        ->withHeader('Content-Type', 'application/json')
                        ->withHeader('Access-Control-Allow-Origin', '*');
                    $errorResponse->getBody()->write(json_encode(['error' => 'Missing required fields']));
                    return $errorResponse;
                }

                // Generate UUID
                $data = random_bytes(16);
                $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
                $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
                $id = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));

                $product = new \App\Model\Product(
                    $id,
                    $tenantId,
                    (string)$body['name'],
                    (float)$body['price'],
                    (string)$body['category'],
                    (string)($body['image'] ?? '📦'),
                    (float)($body['rating'] ?? 5.0),
                    (bool)($body['featured'] ?? false)
                );

                $repo->save($product);

                $response->getBody()->write(json_encode([
                    'success' => true,
                    'product' => $product->toArray()
                ], JSON_THROW_ON_ERROR));

                return $response;
            }

            if ($request->getMethod() === 'DELETE') {
                $tenantId = $request->getAttribute('tenant_id');
                $queryParams = $request->getQueryParams();
                $id = $queryParams['id'] ?? null;

                if (!$id) {
                    $errorResponse = $this->responseFactory->createResponse(400)
                        ->withHeader('Content-Type', 'application/json')
                        ->withHeader('Access-Control-Allow-Origin', '*');
                    $errorResponse->getBody()->write(json_encode(['error' => 'Missing product ID']));
                    return $errorResponse;
                }

                $repo->delete($id, $tenantId);

                $response->getBody()->write(json_encode([
                    'success' => true,
                    'message' => 'Product deleted'
                ], JSON_THROW_ON_ERROR));

                return $response;
            }

            // GET
            $queryParams = $request->getQueryParams();
            $tenantId = $queryParams['tenant_id'] ?? null;

            $products = $repo->findAll($tenantId);
            $data = array_map(fn($product) => $product->toArray(), $products);

            $response->getBody()->write(json_encode([
                'products' => $data
              ], JSON_THROW_ON_ERROR));

            return $response;
        }

        if ($path === '/api/tenants') {
            $repo = new TenantRepository($this->pdo);

            if ($request->getMethod() === 'POST') {
                $body = json_decode((string)$request->getBody(), true);
                if (empty($body['name']) || empty($body['subdomain'])) {
                    $errorResponse = $this->responseFactory->createResponse(400)
                        ->withHeader('Content-Type', 'application/json')
                        ->withHeader('Access-Control-Allow-Origin', '*');
                    $errorResponse->getBody()->write(json_encode(['error' => 'Missing business name or subdomain']));
                    return $errorResponse;
                }

                // Generate UUID
                $data = random_bytes(16);
                $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
                $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
                $id = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));

                $tenant = new \App\Model\Tenant(
                    $id,
                    (string)$body['name'],
                    (string)$body['subdomain'],
                    (string)($body['logo'] ?? '🏪'),
                    (string)($body['category'] ?? 'General'),
                    5.0,
                    (string)($body['bannerGradient'] ?? 'from-indigo-650 to-indigo-900'),
                    (string)($body['business_type'] ?? null),
                    (string)($body['owner_name'] ?? null),
                    (string)($body['email'] ?? null),
                    (string)($body['phone'] ?? null)
                );

                $repo->save($tenant);

                // Auto-create a default product/service for this business type so they start with something
                $productRepo = new ProductRepository($this->pdo);
                $defaultProdId = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex(random_bytes(16)), 4));
                
                $defaultProdName = 'General Service';
                $defaultCategory = 'Services';
                $defaultPrice = 100.0;
                $defaultImage = '🛠️';

                if ($tenant->getBusinessType() === 'new_auto_spare_parts') {
                    $defaultProdName = 'Engine Spark Plug (OEM)';
                    $defaultCategory = 'Parts';
                    $defaultPrice = 45.0;
                    $defaultImage = '🔌';
                } elseif ($tenant->getBusinessType() === 'used_auto_spare_parts') {
                    $defaultProdName = 'Used V6 Engine Hood';
                    $defaultCategory = 'Used Parts';
                    $defaultPrice = 350.0;
                    $defaultImage = '🚗';
                } elseif ($tenant->getBusinessType() === 'tow_company') {
                    $defaultProdName = 'Standard Flatbed Towing (Up to 15km)';
                    $defaultCategory = 'Towing';
                    $defaultPrice = 150.0;
                    $defaultImage = '🛻';
                } elseif ($tenant->getBusinessType() === 'mobile_workshop') {
                    $defaultProdName = 'Mobile Battery Replacement & Jumpstart';
                    $defaultCategory = 'Mobile Service';
                    $defaultPrice = 120.0;
                    $defaultImage = '🔋';
                } elseif ($tenant->getBusinessType() === 'digital_alignment') {
                    $defaultProdName = 'Four-Wheel Laser Alignment';
                    $defaultCategory = 'Alignment';
                    $defaultPrice = 80.0;
                    $defaultImage = '📐';
                } elseif ($tenant->getBusinessType() === 'mechanics_workshop') {
                    $defaultProdName = 'Full Engine Diagnostic & Scan';
                    $defaultCategory = 'Mechanic';
                    $defaultPrice = 90.0;
                    $defaultImage = '🔧';
                }

                $defaultProduct = new \App\Model\Product(
                    $defaultProdId,
                    $id,
                    $defaultProdName,
                    $defaultPrice,
                    $defaultCategory,
                    $defaultImage,
                    5.0,
                    true
                );
                $productRepo->save($defaultProduct);

                $response->getBody()->write(json_encode([
                    'success' => true,
                    'tenant' => $tenant->toArray()
                ], JSON_THROW_ON_ERROR));

                return $response;
            }

            $tenants = $repo->findAll();
            $data = array_map(fn($tenant) => $tenant->toArray(), $tenants);

            $response->getBody()->write(json_encode([
                'tenants' => $data
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

// Determine if endpoint requires tenant isolation context (like orders, and POST/DELETE on products)
$path = $request->getUri()->getPath();
$method = $request->getMethod();
$isPublicRoute = $method === 'OPTIONS' || 
                 $path === '/api/health' || 
                 ($path === '/api/tenants') || // POST/GET tenants are public
                 ($path === '/api/products' && $method === 'GET');

if ($isPublicRoute) {
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
