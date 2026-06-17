<?php

declare(strict_types=1);

namespace App\Repository;

use PDO;
use App\Model\Product;

final class ProductRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Fetch all products from the database, optionally filtered by tenant_id.
     * Note: Because of public SELECT policies, we do not strictly need RLS active
     * to read products globally.
     */
    public function findAll(?string $tenantId = null): array
    {
        if ($tenantId) {
            $stmt = $this->pdo->prepare('SELECT * FROM products WHERE tenant_id = :tenant_id ORDER BY created_at DESC');
            $stmt->execute(['tenant_id' => $tenantId]);
        } else {
            $stmt = $this->pdo->prepare('SELECT * FROM products ORDER BY created_at DESC');
            $stmt->execute();
        }

        $results = [];
        while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $results[] = Product::fromArray($data);
        }

        return $results;
    }
}
