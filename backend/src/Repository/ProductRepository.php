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

    /**
     * Persists a new Product.
     */
    public function save(Product $product): bool
    {
        $sql = 'INSERT INTO products (id, tenant_id, name, price, category, image, rating, featured) 
                VALUES (:id, :tenant_id, :name, :price, :category, :image, :rating, :featured)
                ON CONFLICT (id) DO UPDATE SET 
                    name = EXCLUDED.name,
                    price = EXCLUDED.price,
                    category = EXCLUDED.category,
                    image = EXCLUDED.image,
                    rating = EXCLUDED.rating,
                    featured = EXCLUDED.featured';

        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([
            'id' => $product->getId(),
            'tenant_id' => $product->getTenantId(),
            'name' => $product->getName(),
            'price' => $product->getPrice(),
            'category' => $product->getCategory(),
            'image' => $product->getImage() ?: '📦',
            'rating' => $product->getRating(),
            'featured' => $product->isFeatured() ? 1 : 0
        ]);
    }

    /**
     * Deletes a product.
     */
    public function delete(string $id, string $tenantId): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM products WHERE id = :id AND tenant_id = :tenant_id');
        return $stmt->execute([
            'id' => $id,
            'tenant_id' => $tenantId
        ]);
    }
}
