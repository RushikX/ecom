package handlers

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"ecom-backend/internal/models"
	"ecom-backend/internal/database"
)

type OrdersHandler struct {
	orderCollection   *mongo.Collection
	cartCollection    *mongo.Collection
	productCollection *mongo.Collection
}

func NewOrdersHandler() *OrdersHandler {
	return &OrdersHandler{
		orderCollection:   database.Database.Collection("orders"),
		cartCollection:    database.Database.Collection("carts"),
		productCollection: database.Database.Collection("products"),
	}
}

func (h *OrdersHandler) CreateOrder(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	var req models.CreateOrderRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Validate items and calculate total
	var total float64
	for _, item := range req.Items {
		var product models.Product
		err := h.productCollection.FindOne(database.Ctx, bson.M{"_id": item.ProductID}).Decode(&product)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Product not found: " + item.ProductID.Hex()})
		}

		if product.Stock < item.Quantity {
			return c.Status(400).JSON(fiber.Map{"error": "Insufficient stock for product: " + product.Title})
		}

		total += product.Price * float64(item.Quantity)
	}

	// Create order
	order := models.Order{
		ID:        primitive.NewObjectID(),
		UserID:    objectID,
		Items:     req.Items,
		Total:     total,
		Status:    models.OrderPending,
		Address:   req.Address,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Start transaction
	session, err := database.Client.StartSession()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to start transaction"})
	}
	defer session.EndSession(database.Ctx)

	_, err = session.WithTransaction(database.Ctx, func(ctx mongo.SessionContext) (interface{}, error) {
		// Insert order
		_, err := h.orderCollection.InsertOne(ctx, order)
		if err != nil {
			return nil, err
		}

		// Update product stock
		for _, item := range req.Items {
			_, err := h.productCollection.UpdateOne(ctx, bson.M{"_id": item.ProductID}, bson.M{
				"$inc": bson.M{"stock": -item.Quantity},
			})
			if err != nil {
				return nil, err
			}
		}

		// Clear cart
		_, err = h.cartCollection.DeleteOne(ctx, bson.M{"userId": objectID})
		if err != nil {
			return nil, err
		}

		return order, nil
	})

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create order"})
	}

	return c.Status(201).JSON(order)
}

func (h *OrdersHandler) GetOrders(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	cursor, err := h.orderCollection.Find(database.Ctx, bson.M{"userId": objectID})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch orders"})
	}
	defer cursor.Close(database.Ctx)

	var orders []models.Order
	if err = cursor.All(database.Ctx, &orders); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to decode orders"})
	}

	// Populate product details for each order
	for i := range orders {
		for j := range orders[i].Items {
			var product models.Product
			err := h.productCollection.FindOne(database.Ctx, bson.M{"_id": orders[i].Items[j].ProductID}).Decode(&product)
			if err == nil {
				orders[i].Items[j].Product = &product
			}
		}
	}

	return c.JSON(orders)
}

func (h *OrdersHandler) GetOrder(c *fiber.Ctx) error {
	orderID := c.Params("id")
	objectID, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid order ID"})
	}

	userID := c.Locals("userId").(string)
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	var order models.Order
	err = h.orderCollection.FindOne(database.Ctx, bson.M{
		"_id":    objectID,
		"userId": userObjectID,
	}).Decode(&order)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(404).JSON(fiber.Map{"error": "Order not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch order"})
	}

	// Populate product details for each item
	for i := range order.Items {
		var product models.Product
		err := h.productCollection.FindOne(database.Ctx, bson.M{"_id": order.Items[i].ProductID}).Decode(&product)
		if err == nil {
			order.Items[i].Product = &product
		}
	}

	return c.JSON(order)
}

func (h *OrdersHandler) GetAllOrders(c *fiber.Ctx) error {
	fmt.Println("GetAllOrders called")
	cursor, err := h.orderCollection.Find(database.Ctx, bson.M{})
	if err != nil {
		fmt.Printf("Error finding orders: %v\n", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch orders"})
	}
	defer cursor.Close(database.Ctx)

	var orders []models.Order
	if err = cursor.All(database.Ctx, &orders); err != nil {
		fmt.Printf("Error decoding orders: %v\n", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to decode orders"})
	}

	// Populate product details for each order
	for i := range orders {
		for j := range orders[i].Items {
			var product models.Product
			err := h.productCollection.FindOne(database.Ctx, bson.M{"_id": orders[i].Items[j].ProductID}).Decode(&product)
			if err == nil {
				orders[i].Items[j].Product = &product
			}
		}
	}

	fmt.Printf("Found %d orders\n", len(orders))
	return c.JSON(orders)
}

func (h *OrdersHandler) UpdateOrderStatus(c *fiber.Ctx) error {
	orderID := c.Params("id")
	objectID, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid order ID"})
	}

	var req models.UpdateOrderStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	_, err = h.orderCollection.UpdateOne(database.Ctx, bson.M{"_id": objectID}, bson.M{
		"$set": bson.M{
			"status":    req.Status,
			"updatedAt": time.Now(),
		},
	})

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update order status"})
	}

	return c.JSON(fiber.Map{"message": "Order status updated"})
}

func (h *OrdersHandler) GetAssignedOrders(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	cursor, err := h.orderCollection.Find(database.Ctx, bson.M{"assignedTo": objectID})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch assigned orders"})
	}
	defer cursor.Close(database.Ctx)

	var orders []models.Order
	if err = cursor.All(database.Ctx, &orders); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to decode orders"})
	}

	// Populate product details for each order
	for i := range orders {
		for j := range orders[i].Items {
			var product models.Product
			err := h.productCollection.FindOne(database.Ctx, bson.M{"_id": orders[i].Items[j].ProductID}).Decode(&product)
			if err == nil {
				orders[i].Items[j].Product = &product
			}
		}
	}

	return c.JSON(orders)
}

func (h *OrdersHandler) MarkAsDelivered(c *fiber.Ctx) error {
	orderID := c.Params("id")
	objectID, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid order ID"})
	}

	userID := c.Locals("userId").(string)
	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	// Check if order is assigned to this delivery agent
	var order models.Order
	err = h.orderCollection.FindOne(database.Ctx, bson.M{
		"_id":        objectID,
		"assignedTo": userObjectID,
	}).Decode(&order)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(404).JSON(fiber.Map{"error": "Order not found or not assigned to you"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch order"})
	}

	_, err = h.orderCollection.UpdateOne(database.Ctx, bson.M{"_id": objectID}, bson.M{
		"$set": bson.M{
			"status":    models.OrderDelivered,
			"updatedAt": time.Now(),
		},
	})

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update order status"})
	}

	return c.JSON(fiber.Map{"message": "Order marked as delivered"})
}
