<?php
header('Content-Type: application/json');
include 'connection.php';

$db = new DatabaseConnection();
$conn = $db->conn; 

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name     = trim($_POST['full_name']);
    $email    = trim($_POST['email']);
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
    $role     = 'user'; 

    
    $stmt = $conn->prepare("SELECT user_ID FROM users WHERE email = ?");
    if (!$stmt) {
        echo json_encode(["status" => "error", "message" => "Prepare failed: " . $conn->error]);
        exit;
    }
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        echo json_encode(["status" => "error", "message" => "Email already registered"]);
        $stmt->close();
        $conn->close();
        exit;
    }
    $stmt->close();

    $stmt = $conn->prepare("INSERT INTO users (name, email, password, role, created_at) 
                            VALUES (?, ?, ?, ?, NOW())");
    if (!$stmt) {
        echo json_encode(["status" => "error", "message" => "Prepare failed: " . $conn->error]);
        exit;
    }
    $stmt->bind_param("ssss", $name, $email, $password, $role);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Registration successful"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Registration failed: " . $stmt->error]);
    }

    $stmt->close();
    $conn->close();
}
?>
