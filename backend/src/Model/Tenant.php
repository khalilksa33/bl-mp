<?php

declare(strict_types=1);

namespace App\Model;

final class Tenant
{
    private string $id;
    private string $name;
    private string $logo;
    private string $category;
    private float $rating;
    private string $bannerGradient;

    public function __construct(
        string $id,
        string $name,
        string $logo,
        string $category,
        float $rating,
        string $bannerGradient
    ) {
        $this->id = $id;
        $this->name = $name;
        $this->logo = $logo;
        $this->category = $category;
        $this->rating = $rating;
        $this->bannerGradient = $bannerGradient;
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
            (string)($settings['logo'] ?? '🏪'),
            (string)($settings['category'] ?? 'General'),
            (float)($settings['rating'] ?? 5.0),
            (string)($settings['bannerGradient'] ?? 'from-indigo-650 to-indigo-900')
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'logo' => $this->logo,
            'category' => $this->category,
            'rating' => $this->rating,
            'bannerGradient' => $this->bannerGradient,
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
}
