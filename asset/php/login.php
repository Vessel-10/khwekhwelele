<?php
header('Content-Type: application/json');
include 'connection.php';

session_start();

$db = new DatabaseConnection();
$conn = $db->conn;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = trim($_POST['email']);
    $password = $_POST['password'];

    $stmt = $conn->prepare("SELECT user_ID, name, email, password, role FROM users WHERE email = ?");
    if (!$stmt) {
        echo json_encode(["status" => "error", "message" => "Prepare failed: " . $conn->error]);
        exit;
    }

    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $row = $result->fetch_assoc();

        if (password_verify($password, $row['password'])) {
            $_SESSION['user_ID'] = $row['user_ID'];
            $_SESSION['name']    = $row['name'];
            $_SESSION['email']   = $row['email'];
            $_SESSION['role']    = $row['role'];

            echo json_encode(["status" => "success", "message" => "Login successful"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Invalid password"]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Email not found"]);
    }

    $stmt->close();
    $conn->close();
}
?>
