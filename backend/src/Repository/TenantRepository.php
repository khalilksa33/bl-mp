<?php

declare(strict_types=1);

namespace App\Repository;

use PDO;
use App\Model\Tenant;

final class TenantRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Fetch all tenants from the database.
     * Note: Because of public SELECT policies, we do not need RLS active
     * to read the global tenant list.
     */
    public function findAll(): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM tenants WHERE status = :status ORDER BY name ASC');
        $stmt->execute(['status' => 'active']);

        $results = [];
        while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $results[] = Tenant::fromArray($data);
        }

        return $results;
    }
}
