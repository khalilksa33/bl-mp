<?php

declare(strict_types=1);

namespace App\Model;

final class Tenant
{
    private string $id;
    private string $name;
    private string $subdomain;
    private string $logo;
    private string $category;
    private float $rating;
    private string $bannerGradient;
    private ?string $businessType;
    private ?string $ownerName;
    private ?string $email;
    private ?string $phone;

    public function __construct(
        string $id,
        string $name,
        string $subdomain,
        string $logo,
        string $category,
        float $rating,
        string $bannerGradient,
        ?string $businessType = null,
        ?string $ownerName = null,
        ?string $email = null,
        ?string $phone = null
    ) {
        $this->id = $id;
        $this->name = $name;
        $this->subdomain = $subdomain;
        $this->logo = $logo;
        $this->category = $category;
        $this->rating = $rating;
        $this->bannerGradient = $bannerGradient;
        $this->businessType = $businessType;
        $this->ownerName = $ownerName;
        $this->email = $email;
        $this->phone = $phone;
    }

    public static function fromArray(array $data): self
    {
        $settings = [];
        if (isset($data['settings'])) {
            $settings = is_string($data['settings']) 
                ? json_decode($data['settings'], true) ?? [] 
                : (array)$data['settings'];
        }

        return new self(
            (string)($data['id'] ?? ''),
            (string)($data['name'] ?? ''),
            (string)($data['subdomain'] ?? ''),
            (string)($settings['logo'] ?? '🏪'),
            (string)($settings['category'] ?? 'General'),
            (float)($settings['rating'] ?? 5.0),
            (string)($settings['bannerGradient'] ?? 'from-indigo-650 to-indigo-900'),
            isset($data['business_type']) ? (string)$data['business_type'] : null,
            isset($data['owner_name']) ? (string)$data['owner_name'] : null,
            isset($data['email']) ? (string)$data['email'] : null,
            isset($data['phone']) ? (string)$data['phone'] : null
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'subdomain' => $this->subdomain,
            'logo' => $this->logo,
            'category' => $this->category,
            'rating' => $this->rating,
            'bannerGradient' => $this->bannerGradient,
            'business_type' => $this->businessType,
            'owner_name' => $this->ownerName,
            'email' => $this->email,
            'phone' => $this->phone,
        ];
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getSubdomain(): string
    {
        return $this->subdomain;
    }

    public function getLogo(): string
    {
        return $this->logo;
    }

    public function getCategory(): string
    {
        return $this->category;
    }

    public function getRating(): float
    {
        return $this->rating;
    }

    public function getBannerGradient(): string
    {
        return $this->bannerGradient;
    }

    public function getBusinessType(): ?string
    {
        return $this->businessType;
    }

    public function getOwnerName(): ?string
    {
        return $this->ownerName;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function getPhone(): ?string
    {
        return $this->phone;
    }
}
