<?php
session_start();
include 'connection.php';
$db = new DatabaseConnection();
$conn = $db->conn;

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (!isset($_SESSION['user_ID']) || empty($_SESSION['user_ID'])) {
        echo "You must be logged in to send a message.";
        exit;
    }

    $user_id = $_SESSION['user_ID'];
    $subject = trim($_POST['subject']);
    $message = trim($_POST['message']);

    if (!empty($subject) && !empty($message)) {
        $stmt = $conn->prepare("INSERT INTO contact_messages (user_ID, subject, message) VALUES (?, ?, ?)");
        if (!$stmt) {
            die("Prepare failed: " . $conn->error);
        }
        $stmt->bind_param("iss", $user_id, $subject, $message);

        if ($stmt->execute()) {
            header("Location: ../pages/home.html"); 
            exit();
        } else {
            echo "Error: " . $stmt->error;
        }
        $stmt->close();
    } else {
        echo "All fields are required.";
    }
    $db->closeConnection();
}
?>
