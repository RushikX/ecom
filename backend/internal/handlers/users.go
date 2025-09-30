package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"ecom-backend/internal/models"
	"ecom-backend/internal/database"
)

type UsersHandler struct {
	collection *mongo.Collection
}

func NewUsersHandler() *UsersHandler {
	return &UsersHandler{
		collection: database.Database.Collection("users"),
	}
}

func (h *UsersHandler) GetUsers(c *fiber.Ctx) error {
	cursor, err := h.collection.Find(database.Ctx, bson.M{})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch users"})
	}
	defer cursor.Close(database.Ctx)

	var users []models.User
	if err = cursor.All(database.Ctx, &users); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to decode users"})
	}

	// Remove passwords from response
	for i := range users {
		users[i].Password = ""
	}

	return c.JSON(users)
}

func (h *UsersHandler) GetUser(c *fiber.Ctx) error {
	userID := c.Params("id")
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	var user models.User
	err = h.collection.FindOne(database.Ctx, bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(404).JSON(fiber.Map{"error": "User not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch user"})
	}

	// Remove password from response
	user.Password = ""

	return c.JSON(user)
}

func (h *UsersHandler) BlockUser(c *fiber.Ctx) error {
	userID := c.Params("id")
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	_, err = h.collection.UpdateOne(database.Ctx, bson.M{"_id": objectID}, bson.M{
		"$set": bson.M{
			"isActive":  false,
			"updatedAt": time.Now(),
		},
	})

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to block user"})
	}

	return c.JSON(fiber.Map{"message": "User blocked successfully"})
}

func (h *UsersHandler) UnblockUser(c *fiber.Ctx) error {
	userID := c.Params("id")
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	_, err = h.collection.UpdateOne(database.Ctx, bson.M{"_id": objectID}, bson.M{
		"$set": bson.M{
			"isActive":  true,
			"updatedAt": time.Now(),
		},
	})

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to unblock user"})
	}

	return c.JSON(fiber.Map{"message": "User unblocked successfully"})
}

func (h *UsersHandler) AssignOrderToDelivery(c *fiber.Ctx) error {
	orderID := c.Params("orderId")
	orderObjectID, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid order ID"})
	}

	deliveryID := c.Params("deliveryId")
	deliveryObjectID, err := primitive.ObjectIDFromHex(deliveryID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid delivery ID"})
	}

	// Check if delivery agent exists and has delivery role
	var deliveryUser models.User
	err = h.collection.FindOne(database.Ctx, bson.M{
		"_id":      deliveryObjectID,
		"role":     models.RoleDelivery,
		"isActive": true,
	}).Decode(&deliveryUser)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(404).JSON(fiber.Map{"error": "Delivery agent not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch delivery agent"})
	}

	// Update order with assigned delivery agent
	orderCollection := database.Database.Collection("orders")
	_, err = orderCollection.UpdateOne(database.Ctx, bson.M{"_id": orderObjectID}, bson.M{
		"$set": bson.M{
			"assignedTo": deliveryObjectID,
			"updatedAt":  time.Now(),
		},
	})

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to assign order"})
	}

	return c.JSON(fiber.Map{"message": "Order assigned to delivery agent"})
}
