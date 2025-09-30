package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserRole string

const (
	RoleCustomer UserRole = "customer"
	RoleAdmin    UserRole = "admin"
	RoleDelivery UserRole = "delivery"
)

type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Email     string             `bson:"email" json:"email"`
	Password  string             `bson:"password" json:"-"`
	Role      UserRole           `bson:"role" json:"role"`
	IsActive  bool               `bson:"isActive" json:"isActive"`
	Address   string             `bson:"address,omitempty" json:"address,omitempty"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type Product struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title       string             `bson:"title" json:"title"`
	Description string             `bson:"description" json:"description"`
	Price       float64            `bson:"price" json:"price"`
	Stock       int                `bson:"stock" json:"stock"`
	Images      []string           `bson:"images" json:"images"`
	Category    string             `bson:"category" json:"category"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type CartItem struct {
	ProductID primitive.ObjectID `bson:"productId" json:"productId"`
	Quantity  int                `bson:"quantity" json:"quantity"`
	Product   *Product           `bson:"product,omitempty" json:"product,omitempty"`
}

type OrderStatus string

const (
	OrderPending   OrderStatus = "pending"
	OrderShipped   OrderStatus = "shipped"
	OrderDelivered OrderStatus = "delivered"
	OrderCancelled OrderStatus = "cancelled"
)

type Order struct {
	ID         primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	UserID     primitive.ObjectID  `bson:"userId" json:"userId"`
	Items      []CartItem          `bson:"items" json:"items"`
	Total      float64             `bson:"total" json:"total"`
	Status     OrderStatus         `bson:"status" json:"status"`
	Address    string              `bson:"address" json:"address"`
	AssignedTo *primitive.ObjectID `bson:"assignedTo,omitempty" json:"assignedTo,omitempty"`
	CreatedAt  time.Time           `bson:"createdAt" json:"createdAt"`
	UpdatedAt  time.Time           `bson:"updatedAt" json:"updatedAt"`
}

type Cart struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    primitive.ObjectID `bson:"userId" json:"userId"`
	Items     []CartItem         `bson:"items" json:"items"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// Auth request/response models
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type SignupRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type AuthResponse struct {
	Token        string   `json:"token"`
	RefreshToken string   `json:"refreshToken"`
	User         User     `json:"user"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" validate:"required"`
}

// Product request models
type CreateProductRequest struct {
	Title       string   `json:"title" validate:"required"`
	Description string   `json:"description" validate:"required"`
	Price       float64  `json:"price" validate:"required,min=0"`
	Stock       int      `json:"stock" validate:"required,min=0"`
	Images      []string `json:"images"`
	Category    string   `json:"category" validate:"required"`
}

type UpdateProductRequest struct {
	Title       *string   `json:"title,omitempty"`
	Description *string   `json:"description,omitempty"`
	Price       *float64  `json:"price,omitempty"`
	Stock       *int      `json:"stock,omitempty"`
	Images      []string  `json:"images,omitempty"`
	Category    *string   `json:"category,omitempty"`
}

// Order request models
type CreateOrderRequest struct {
	Items   []CartItem `json:"items" validate:"required,min=1"`
	Address string     `json:"address" validate:"required"`
}

type UpdateOrderStatusRequest struct {
	Status OrderStatus `json:"status" validate:"required"`
}

// Cart request models
type AddToCartRequest struct {
	ProductID primitive.ObjectID `json:"productId" validate:"required"`
	Quantity  int                `json:"quantity" validate:"required,min=1"`
}

type UpdateCartItemRequest struct {
	Quantity int `json:"quantity" validate:"required,min=1"`
}

// User request models
type UpdateProfileRequest struct {
	Email   string `json:"email,omitempty" validate:"omitempty,email"`
	Address string `json:"address,omitempty"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" validate:"required"`
	NewPassword     string `json:"newPassword" validate:"required,min=6"`
}
