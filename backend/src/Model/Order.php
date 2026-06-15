<?php

declare(strict_types=1);

namespace App\Model;

final class Order
{
    private string $id;
    private string $tenantId;
    private string $orderNumber;
    private string $customerId;
    private float $totalAmount;
    private string $currency;
    private string $status;
    private array $metadata;

    public function __construct(
        string $id,
        string $tenantId,
        string $orderNumber,
        string $customerId,
        float $totalAmount,
        string $currency,
        string $status,
        array $metadata
    ) {
        $this->id = $id;
        $this->tenantId = $tenantId;
        $this->orderNumber = $orderNumber;
        $this->customerId = $customerId;
        $this->totalAmount = $totalAmount;
        $this->currency = $currency;
        $this->status = $status;
        $this->metadata = $metadata;
    }

    public static function fromArray(array $data): self
    {
        return new self(
            (string)($data['id'] ?? ''),
            (string)($data['tenant_id'] ?? ''),
            (string)($data['order_number'] ?? ''),
            (string)($data['customer_id'] ?? ''),
            (float)($data['total_amount'] ?? 0.0),
            (string)($data['currency'] ?? 'USD'),
            (string)($data['status'] ?? 'pending'),
            is_string($data['metadata'] ?? null) 
                ? json_decode($data['metadata'], true) ?? [] 
                : (array)($data['metadata'] ?? [])
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenantId,
            'order_number' => $this->orderNumber,
            'customer_id' => $this->customerId,
            'total_amount' => $this->totalAmount,
            'currency' => $this->currency,
            'status' => $this->status,
            'metadata' => $this->metadata,
        ];
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getTenantId(): string
    {
        return $this->tenantId;
    }

    public function getOrderNumber(): string
    {
        return $this->orderNumber;
    }

    public function getCustomerId(): string
    {
        return $this->customerId;
    }

    public function getTotalAmount(): float
    {
        return $this->totalAmount;
    }

    public function getCurrency(): string
    {
        return $this->currency;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function getMetadata(): array
    {
        return $this->metadata;
    }
}
