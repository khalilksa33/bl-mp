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

    /**
     * Persists a new Tenant (vendor) record.
     */
    public function save(Tenant $tenant): bool
    {
        $sql = 'INSERT INTO tenants (id, name, subdomain, status, business_type, owner_name, email, phone, settings) 
                VALUES (:id, :name, :subdomain, :status, :business_type, :owner_name, :email, :phone, :settings)
                ON CONFLICT (id) DO UPDATE SET 
                    name = EXCLUDED.name,
                    subdomain = EXCLUDED.subdomain,
                    status = EXCLUDED.status,
                    business_type = EXCLUDED.business_type,
                    owner_name = EXCLUDED.owner_name,
                    email = EXCLUDED.email,
                    phone = EXCLUDED.phone,
                    settings = EXCLUDED.settings';

        $stmt = $this->pdo->prepare($sql);
        
        $settings = json_encode([
            'logo' => $tenant->getLogo(),
            'category' => $tenant->getCategory(),
            'rating' => $tenant->getRating(),
            'bannerGradient' => $tenant->getBannerGradient()
        ], JSON_THROW_ON_ERROR);

        return $stmt->execute([
            'id' => $tenant->getId(),
            'name' => $tenant->getName(),
            'subdomain' => $tenant->getSubdomain(),
            'status' => 'active',
            'business_type' => $tenant->getBusinessType(),
            'owner_name' => $tenant->getOwnerName(),
            'email' => $tenant->getEmail(),
            'phone' => $tenant->getPhone(),
            'settings' => $settings
        ]);
    }
}
