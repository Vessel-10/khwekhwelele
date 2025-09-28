<?php
class DatabaseConnection {
    private $servername = "localhost";
    private $username   = "root";
    private $password   = "";
    private $dbname     = "bus";

    public $conn;

    public function __construct() {
        $this->conn = new mysqli(
            $this->servername,
            $this->username,
            $this->password,
            $this->dbname
        );

        if ($this->conn->connect_error) {

            die(json_encode([
                "status" => "error",
                "message" => "Database connection failed: " . $this->conn->connect_error
            ]));
        }
    }

    public function closeConnection() {
        if ($this->conn) {
            $this->conn->close();
        }
    }
}
?>
