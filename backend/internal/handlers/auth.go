package handlers

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"

	"ecom-backend/internal/models"
	"ecom-backend/internal/database"
	"ecom-backend/internal/middleware"
)

type AuthHandler struct {
	collection *mongo.Collection
	jwtSecret  string
}

func NewAuthHandler(jwtSecret string) *AuthHandler {
	return &AuthHandler{
		collection: database.Database.Collection("users"),
		jwtSecret:  jwtSecret,
	}
}

func (h *AuthHandler) Signup(c *fiber.Ctx) error {
	var req models.SignupRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Check if user already exists
	var existingUser models.User
	err := h.collection.FindOne(database.Ctx, bson.M{"email": req.Email}).Decode(&existingUser)
	if err == nil {
		return c.Status(400).JSON(fiber.Map{"error": "User already exists"})
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to hash password"})
	}

	// Create user
	user := models.User{
		ID:        primitive.NewObjectID(),
		Email:     req.Email,
		Password:  string(hashedPassword),
		Role:      models.RoleCustomer,
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err = h.collection.InsertOne(database.Ctx, user)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create user"})
	}

	// Generate tokens
	token, err := middleware.GenerateToken(&user, h.jwtSecret)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	refreshToken, err := middleware.GenerateRefreshToken(&user, h.jwtSecret)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate refresh token"})
	}

	// Remove password from response
	user.Password = ""

	return c.JSON(models.AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	})
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req models.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Find user
	var user models.User
	err := h.collection.FindOne(database.Ctx, bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	// Debug logging
	fmt.Printf("User found: %+v\n", user)
	fmt.Printf("IsActive: %v\n", user.IsActive)

	// Check if user is active
	if !user.IsActive {
		return c.Status(401).JSON(fiber.Map{
			"error": "Account is deactivated", 
			"debug": fiber.Map{
				"user": user,
				"isActive": user.IsActive,
			},
		})
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	// Generate tokens
	token, err := middleware.GenerateToken(&user, h.jwtSecret)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	refreshToken, err := middleware.GenerateRefreshToken(&user, h.jwtSecret)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate refresh token"})
	}

	// Remove password from response
	user.Password = ""

	return c.JSON(models.AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	})
}

func (h *AuthHandler) RefreshToken(c *fiber.Ctx) error {
	var req models.RefreshTokenRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Parse refresh token
	token, err := jwt.ParseWithClaims(req.RefreshToken, &middleware.Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(h.jwtSecret), nil
	})

	if err != nil || !token.Valid {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid refresh token"})
	}

	claims, ok := token.Claims.(*middleware.Claims)
	if !ok {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid token claims"})
	}

	// Find user
	var user models.User
	err = h.collection.FindOne(database.Ctx, bson.M{"_id": claims.UserID}).Decode(&user)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "User not found"})
	}

	if !user.IsActive {
		return c.Status(401).JSON(fiber.Map{"error": "Account is deactivated"})
	}

	// Generate new tokens
	newToken, err := middleware.GenerateToken(&user, h.jwtSecret)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	newRefreshToken, err := middleware.GenerateRefreshToken(&user, h.jwtSecret)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate refresh token"})
	}

	// Remove password from response
	user.Password = ""

	return c.JSON(models.AuthResponse{
		Token:        newToken,
		RefreshToken: newRefreshToken,
		User:         user,
	})
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	// In a real application, you might want to blacklist the token
	// For now, we'll just return success
	return c.JSON(fiber.Map{"message": "Logged out successfully"})
}

func (h *AuthHandler) GetProfile(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	var user models.User
	err = h.collection.FindOne(database.Ctx, bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	// Remove password from response
	user.Password = ""

	return c.JSON(user)
}

func (h *AuthHandler) UpdateProfile(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	var req models.UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	update := bson.M{"updatedAt": time.Now()}
	if req.Email != "" {
		update["email"] = req.Email
	}
	if req.Address != "" {
		update["address"] = req.Address
	}

	_, err = h.collection.UpdateOne(database.Ctx, bson.M{"_id": objectID}, bson.M{"$set": update})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update profile"})
	}

	// Return updated user
	var user models.User
	err = h.collection.FindOne(database.Ctx, bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch updated user"})
	}

	user.Password = ""
	return c.JSON(user)
}

func (h *AuthHandler) ChangePassword(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	var req models.ChangePasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Get current user
	var user models.User
	err = h.collection.FindOne(database.Ctx, bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	// Verify current password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Current password is incorrect"})
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to hash password"})
	}

	// Update password
	_, err = h.collection.UpdateOne(database.Ctx, bson.M{"_id": objectID}, bson.M{
		"$set": bson.M{
			"password":  string(hashedPassword),
			"updatedAt": time.Now(),
		},
	})

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update password"})
	}

	return c.JSON(fiber.Map{"message": "Password updated successfully"})
}
