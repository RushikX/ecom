package middleware

import (
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"ecom-backend/internal/models"
	"ecom-backend/internal/database"
)

type Claims struct {
	UserID primitive.ObjectID `json:"userId"`
	Email  string             `json:"email"`
	Role   models.UserRole    `json:"role"`
	jwt.RegisteredClaims
}

func AuthRequired(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(401).JSON(fiber.Map{"error": "Authorization header required"})
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			return c.Status(401).JSON(fiber.Map{"error": "Bearer token required"})
		}

		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			return c.Status(401).JSON(fiber.Map{"error": "Invalid token"})
		}

		claims, ok := token.Claims.(*Claims)
		if !ok {
			return c.Status(401).JSON(fiber.Map{"error": "Invalid token claims"})
		}

		// Check if user still exists and is active
		var user models.User
		err = database.Database.Collection("users").FindOne(database.Ctx, bson.M{
			"_id":      claims.UserID,
			"isActive": true,
		}).Decode(&user)

		if err != nil {
			return c.Status(401).JSON(fiber.Map{"error": "User not found or inactive"})
		}

		// Store user info in context
		c.Locals("userId", claims.UserID.Hex())
		c.Locals("userRole", claims.Role)
		c.Locals("userEmail", claims.Email)

		return c.Next()
	}
}

func RequireRole(role models.UserRole) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole := c.Locals("userRole")
		if userRole != role {
			return c.Status(403).JSON(fiber.Map{"error": "Insufficient permissions"})
		}
		return c.Next()
	}
}

func GenerateToken(user *models.User, jwtSecret string) (string, error) {
	claims := &Claims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))
}

func GenerateRefreshToken(user *models.User, jwtSecret string) (string, error) {
	claims := &Claims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))
}
