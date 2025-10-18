<?php
require_once 'connection.php';
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        "status" => "error", 
        "message" => "Invalid request method"
    ]);
    exit();
}
try {
    $db = new DatabaseConnection();
    $conn = $db->conn;
    $origin = isset($_POST['origin']) ? trim($_POST['origin']) : '';
    $destination = isset($_POST['destination']) ? trim($_POST['destination']) : '';
    $travel_date = isset($_POST['date']) ? $_POST['date'] : '';
    if (empty($origin) || empty($destination) || empty($travel_date)) {
        echo json_encode([
            "status" => "error",
            "message" => "Please provide origin, destination, and travel date"
        ]);
        exit();
    }
    $search_date = DateTime::createFromFormat('Y-m-d', $travel_date);
    $today = new DateTime();
    $today->setTime(0, 0, 0);
    if (!$search_date || $search_date < $today) {
        echo json_encode([
            "status" => "error",
            "message" => "Please select a valid future date"
        ]);
        exit();
    }
    $search_query = "
        SELECT DISTINCT
            s.schedule_ID,
            s.departure_time,
            s.arrival_time,
            b.bus_ID,
            b.bus_number,
            b.capacity,
            r.route_ID,
            r.origin,
            r.destination,
            r.single_adult,
            r.single_child,
            r.return_adult,
            r.return_child,
            COALESCE(booked_seats.total_booked, 0) as total_booked,
            (b.capacity - COALESCE(booked_seats.total_booked, 0)) as seats_left
        FROM schedule s
        JOIN buses b ON s.bus_ID = b.bus_ID
        JOIN routes r ON s.route_ID = r.route_ID
        LEFT JOIN (
            SELECT 
                schedule_ID, 
                SUM(seats) as total_booked 
            FROM booking 
            WHERE travel_date = ? 
            AND status IN ('pending', 'confirmed')
            GROUP BY schedule_ID
        ) booked_seats ON s.schedule_ID = booked_seats.schedule_ID
        WHERE LOWER(r.origin) = LOWER(?)
        AND LOWER(r.destination) = LOWER(?)
        AND (b.capacity - COALESCE(booked_seats.total_booked, 0)) > 0
        ORDER BY s.departure_time ASC
    ";
    $stmt = $conn->prepare($search_query);
    $stmt->bind_param("sss", $travel_date, $origin, $destination);
    $stmt->execute();
    $result = $stmt->get_result();
    $buses = [];
    while ($row = $result->fetch_assoc()) {
        $buses[] = [
            'schedule_ID' => $row['schedule_ID'],
            'bus_number' => $row['bus_number'],
            'capacity' => intval($row['capacity']),
            'departure_time' => $row['departure_time'],
            'arrival_time' => $row['arrival_time'],
            'origin' => $row['origin'],
            'destination' => $row['destination'],
            'single_adult' => floatval($row['single_adult']),
            'single_child' => floatval($row['single_child']),
            'return_adult' => floatval($row['return_adult']),
            'return_child' => floatval($row['return_child']),
            'seats_left' => intval($row['seats_left'])
        ];
    }
    if (empty($buses)) {
        $route_check_query = "
            SELECT COUNT(*) as route_count 
            FROM routes 
            WHERE LOWER(origin) = LOWER(?) 
            AND LOWER(destination) = LOWER(?)
        ";
        $route_stmt = $conn->prepare($route_check_query);
        $route_stmt->bind_param("ss", $origin, $destination);
        $route_stmt->execute();
        $route_result = $route_stmt->get_result();
        $route_data = $route_result->fetch_assoc();
        if ($route_data['route_count'] == 0) {
            $reverse_check_query = "
                SELECT origin, destination 
                FROM routes 
                WHERE LOWER(origin) = LOWER(?) 
                AND LOWER(destination) = LOWER(?)
                LIMIT 1
            ";            
            $reverse_stmt = $conn->prepare($reverse_check_query);
            $reverse_stmt->bind_param("ss", $destination, $origin);
            $reverse_stmt->execute();
            $reverse_result = $reverse_stmt->get_result();            
            if ($reverse_result->num_rows > 0) {
                $reverse_route = $reverse_result->fetch_assoc();
                $suggestion = "Did you mean {$reverse_route['origin']} to {$reverse_route['destination']}?";
            } else {
                $suggestion = "Please check the route names or contact support for assistance.";
            }       
            echo json_encode([
                "status" => "success",
                "message" => "No route found between {$origin} and {$destination}",
                "suggestion" => $suggestion,
                "data" => [],
                "search_info" => [
                    "origin" => $origin,
                    "destination" => $destination,
                    "date" => $travel_date
                ]
            ]);
        } else {
            echo json_encode([
                "status" => "success",
                "message" => "No buses available for the selected date",
                "suggestion" => "Try selecting a different date or check back later for updated schedules.",
                "data" => [],
                "search_info" => [
                    "origin" => $origin,
                    "destination" => $destination,
                    "date" => $travel_date
                ]
            ]);
        }
    } else {
        echo json_encode([
            "status" => "success",
            "message" => "Buses found successfully",
            "data" => $buses,
            "search_info" => [
                "origin" => $origin,
                "destination" => $destination,
                "date" => $travel_date
            ]
        ]);
    }
} catch (Exception $e) {
    error_log("Search Error: " . $e->getMessage());
    echo json_encode([
        "status" => "error",
        "message" => "Unable to search for buses. Please try again later."
    ]);
} finally {
    if (isset($db)) {
        $db->closeConnection();
    }
}
?>
