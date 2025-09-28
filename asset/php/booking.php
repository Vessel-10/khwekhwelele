<?php
session_start();
require_once 'connection.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_ID'])) {
    echo json_encode([
        "status" => "error",
        "message" => "Please log in to make a booking"
    ]);
    exit();
}

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
    
    $user_id = $_SESSION['user_ID'];
    $schedule_id = isset($_POST['schedule_id']) ? intval($_POST['schedule_id']) : 0;
    $travel_date = isset($_POST['travel_date']) ? $_POST['travel_date'] : '';
    $seats = isset($_POST['seats']) ? intval($_POST['seats']) : 0;
    $ticket_type = isset($_POST['ticket_type']) ? $_POST['ticket_type'] : 'single';
    $passenger_type = isset($_POST['passenger_type']) ? $_POST['passenger_type'] : 'adult';
    
    if (empty($schedule_id) || empty($travel_date) || empty($seats)) {
        echo json_encode([
            "status" => "error",
            "message" => "Missing required booking information"
        ]);
        exit();
    }
    
    $booking_date = DateTime::createFromFormat('Y-m-d', $travel_date);
    $today = new DateTime();
    $today->setTime(0, 0, 0);
    
    if (!$booking_date || $booking_date < $today) {
        echo json_encode([
            "status" => "error",
            "message" => "Invalid travel date. Please select a future date."
        ]);
        exit();
    }
    
    if (!in_array($ticket_type, ['single', 'return'])) {
        echo json_encode([
            "status" => "error",
            "message" => "Invalid ticket type"
        ]);
        exit();
    }
    
    if (!in_array($passenger_type, ['adult', 'child'])) {
        echo json_encode([
            "status" => "error",
            "message" => "Invalid passenger type"
        ]);
        exit();
    }
    
    if ($seats < 1 || $seats > 10) {
        echo json_encode([
            "status" => "error",
            "message" => "Invalid number of seats. Must be between 1 and 10."
        ]);
        exit();
    }
    
    $conn->begin_transaction();
    
    try {
        $schedule_query = "
            SELECT 
                s.schedule_ID,
                s.bus_ID,
                s.departure_time,
                s.arrival_time,
                b.bus_number,
                b.capacity,
                r.route_ID,
                r.origin,
                r.destination,
                r.single_adult,
                r.single_child,
                r.return_adult,
                r.return_child
            FROM schedule s
            JOIN buses b ON s.bus_ID = b.bus_ID
            JOIN routes r ON s.route_ID = r.route_ID
            WHERE s.schedule_ID = ?
        ";
        
        $schedule_stmt = $conn->prepare($schedule_query);
        $schedule_stmt->bind_param("i", $schedule_id);
        $schedule_stmt->execute();
        $schedule_result = $schedule_stmt->get_result();
        
        if ($schedule_result->num_rows === 0) {
            throw new Exception("Invalid bus schedule selected");
        }
        
        $schedule_data = $schedule_result->fetch_assoc();
        
        $booked_seats_query = "
            SELECT COALESCE(SUM(seats), 0) as total_booked 
            FROM booking 
            WHERE schedule_ID = ? 
            AND travel_date = ? 
            AND status IN ('pending', 'confirmed')
        ";
        
        $booked_stmt = $conn->prepare($booked_seats_query);
        $booked_stmt->bind_param("is", $schedule_id, $travel_date);
        $booked_stmt->execute();
        $booked_result = $booked_stmt->get_result();
        $booked_data = $booked_result->fetch_assoc();
        
        $total_booked = $booked_data['total_booked'];
        $available_seats = $schedule_data['capacity'] - $total_booked;
        
        if ($seats > $available_seats) {
            throw new Exception("Not enough seats available. Only $available_seats seats remaining.");
        }
        
        $price_per_ticket = 0;
        if ($ticket_type === 'single') {
            $price_per_ticket = ($passenger_type === 'adult') ? 
                $schedule_data['single_adult'] : $schedule_data['single_child'];
        } else {
            $price_per_ticket = ($passenger_type === 'adult') ? 
                $schedule_data['return_adult'] : $schedule_data['return_child'];
        }
        
        $total_amount = $price_per_ticket * $seats;
        
        $booking_query = "
            INSERT INTO booking (
                user_ID, 
                schedule_ID, 
                seats, 
                ticket_type, 
                passenger_type, 
                travel_date, 
                status
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
        ";
        
        $booking_stmt = $conn->prepare($booking_query);
        $booking_stmt->bind_param(
            "iiisss", 
            $user_id, 
            $schedule_id, 
            $seats, 
            $ticket_type, 
            $passenger_type, 
            $travel_date
        );
        
        if (!$booking_stmt->execute()) {
            throw new Exception("Failed to create booking");
        }
        
        $booking_id = $conn->insert_id;
        
        $payment_query = "
            INSERT INTO payments (
                booking_ID, 
                amount, 
                method, 
                status
            ) VALUES (?, ?, 'mobile_money', 'pending')
        ";
        
        $payment_stmt = $conn->prepare($payment_query);
        $payment_stmt->bind_param("id", $booking_id, $total_amount);
        
        if (!$payment_stmt->execute()) {
            throw new Exception("Failed to create payment record");
        }
        
        $conn->commit();
        
        echo json_encode([
            "status" => "success",
            "message" => "Booking created successfully",
            "booking_id" => $booking_id,
            "booking_details" => [
                "booking_id" => $booking_id,
                "bus_number" => $schedule_data['bus_number'],
                "route" => $schedule_data['origin'] . " → " . $schedule_data['destination'],
                "travel_date" => $travel_date,
                "departure_time" => $schedule_data['departure_time'],
                "arrival_time" => $schedule_data['arrival_time'],
                "seats" => $seats,
                "ticket_type" => ucfirst($ticket_type),
                "passenger_type" => ucfirst($passenger_type),
                "price_per_ticket" => number_format($price_per_ticket, 2),
                "total_amount" => number_format($total_amount, 2),
                "status" => "Pending Payment"
            ]
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Booking Error: " . $e->getMessage());
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
} finally {
    if (isset($db)) {
        $db->closeConnection();
    }
}
?>