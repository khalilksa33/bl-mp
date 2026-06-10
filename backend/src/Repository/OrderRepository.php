<?php

declare(strict_types=1);

namespace App\Repository;

use PDO;
use App\Model\Order;
use InvalidArgumentException;

/**
 * OrderRepository retrieves and persists order objects. 
 * Note that RLS handles isolation implicitly; we do not need to append
 * "WHERE tenant_id = ..." to queries, but when inserting we must specify the active tenant ID.
 */
final class OrderRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Finds an order by its ID. Rows outside of the tenant's access space 
     * are automatically invisible at the PostgreSQL engine level.
     */
    public function find(string $id): ?Order
    {
        $stmt = $this->pdo->prepare('SELECT * FROM orders WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$data) {
            return null;
        }

        return Order::fromArray($data);
    }

    /**
     * Lists all orders for the current tenant.
     * RLS naturally filters out other tenants' orders.
     */
    public function findAll(): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM orders ORDER BY created_at DESC');
        $stmt->execute();
        $results = [];

        while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $results[] = Order::fromArray($data);
        }

        return $results;
    }

    /**
     * Persists a new Order record. 
     * RLS checks that the tenant_id matches the session variable on insertion.
     */
    public function save(Order $order): bool
    {
        $sql = 'INSERT INTO orders (id, tenant_id, order_number, customer_id, total_amount, currency, status, metadata) 
                VALUES (:id, :tenant_id, :order_number, :customer_id, :total_amount, :currency, :status, :metadata)
                ON CONFLICT (id) DO UPDATE SET 
                    order_number = EXCLUDED.order_number,
                    customer_id = EXCLUDED.customer_id,
                    total_amount = EXCLUDED.total_amount,
                    currency = EXCLUDED.currency,
                    status = EXCLUDED.status,
                    metadata = EXCLUDED.metadata';

        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([
            'id' => $order->getId(),
            'tenant_id' => $order->getTenantId(),
            'order_number' => $order->getOrderNumber(),
            'customer_id' => $order->getCustomerId(),
            'total_amount' => $order->getTotalAmount(),
            'currency' => $order->getCurrency(),
            'status' => $order->getStatus(),
            'metadata' => json_encode($order->getMetadata(), JSON_THROW_ON_ERROR)
        ]);
    }
}
