<?php

declare(strict_types=1);

namespace App\Model;

final class Product
{
    private string $id;
    private string $tenantId;
    private string $name;
    private float $price;
    private string $category;
    private ?string $image;
    private float $rating;
    private bool $featured;

    public function __construct(
        string $id,
        string $tenantId,
        string $name,
        float $price,
        string $category,
        ?string $image,
        float $rating,
        bool $featured
    ) {
        $this->id = $id;
        $this->tenantId = $tenantId;
        $this->name = $name;
        $this->price = $price;
        $this->category = $category;
        $this->image = $image;
        $this->rating = $rating;
        $this->featured = $featured;
    }

    public static function fromArray(array $data): self
    {
        return new self(
            (string)($data['id'] ?? ''),
            (string)($data['tenant_id'] ?? ''),
            (string)($data['name'] ?? ''),
            (float)($data['price'] ?? 0.0),
            (string)($data['category'] ?? ''),
            $data['image'] ? (string)$data['image'] : null,
            (float)($data['rating'] ?? 0.0),
            (bool)($data['featured'] ?? false)
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenantId,
            'name' => $this->name,
            'price' => $this->price,
            'category' => $this->category,
            'image' => $this->image,
            'rating' => $this->rating,
            'featured' => $this->featured,
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

    public function getName(): string
    {
        return $this->name;
    }

    public function getPrice(): float
    {
        return $this->price;
    }

    public function getCategory(): string
    {
        return $this->category;
    }

    public function getImage(): ?string
    {
        return $this->image;
    }

    public function getRating(): float
    {
        return $this->rating;
    }

    public function isFeatured(): bool
    {
        return $this->featured;
    }
}
