<?php
try {
    $dsn = "pgsql:host=172.20.225.9;port=5432;dbname=marketplace";
    $pdo = new PDO($dsn, 'postgres', 'secretpassword', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo "Database Connected successfully!\n";

    // Let's verify the columns of the tenants table
    $q = $pdo->query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tenants'");
    echo "Tenants table columns:\n";
    while ($row = $q->fetch(PDO::FETCH_ASSOC)) {
        echo " - {$row['column_name']}: {$row['data_type']}\n";
    }
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
