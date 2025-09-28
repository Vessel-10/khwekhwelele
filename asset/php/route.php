<?php
header('Content-Type: application/json');
require_once 'connection.php';

try {
    $db = new DatabaseConnection();
    $conn = $db->conn;

    $sql = "SELECT * FROM routes ORDER BY origin, destination";
    $result = $conn->query($sql);

    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }

    $routes = [];
    while ($row = $result->fetch_assoc()) {
        // Format the prices properly
        $row['single_adult'] = number_format($row['single_adult'], 0);
        $row['single_child'] = number_format($row['single_child'], 0);
        $row['return_adult'] = number_format($row['return_adult'], 0);
        $row['return_child'] = number_format($row['return_child'], 0);
        
        $routes[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "data" => $routes
    ]);

} catch (Exception $e) {
    error_log("Route fetch error: " . $e->getMessage());
    
    echo json_encode([
        "status" => "error",
        "message" => "Failed to fetch routes: " . $e->getMessage()
    ]);
}
?>