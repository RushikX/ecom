import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Order, CreateOrderRequest, UpdateOrderStatusRequest } from '../../types';
import api from '../../utils/api';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  deliveryAgents: any[];
  loading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  deliveryAgents: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<Order[]>('/orders');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch orders');
    }
  }
);

export const fetchAllOrders = createAsyncThunk(
  'orders/fetchAllOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<Order[]>('/orders/all');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch orders');
    }
  }
);

export const fetchOrder = createAsyncThunk(
  'orders/fetchOrder',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get<Order>(`/orders/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch order');
    }
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData: CreateOrderRequest, { rejectWithValue }) => {
    try {
      const response = await api.post<Order>('/orders', orderData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create order');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ id, status }: { id: string; status: UpdateOrderStatusRequest }, { rejectWithValue }) => {
    try {
      await api.put(`/orders/${id}/status`, status);
      return { id, status };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update order status');
    }
  }
);

export const fetchAssignedOrders = createAsyncThunk(
  'orders/fetchAssignedOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<Order[]>('/delivery/orders');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch assigned orders');
    }
  }
);

export const markAsDelivered = createAsyncThunk(
  'orders/markAsDelivered',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.put(`/delivery/orders/${id}/delivered`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to mark as delivered');
    }
  }
);

export const assignOrderToDelivery = createAsyncThunk(
  'orders/assignOrderToDelivery',
  async ({ orderId, deliveryId }: { orderId: string; deliveryId: string }, { rejectWithValue }) => {
    try {
      await api.put(`/orders/${orderId}/assign/${deliveryId}`);
      return { orderId, deliveryId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to assign order');
    }
  }
);

export const fetchDeliveryAgents = createAsyncThunk(
  'orders/fetchDeliveryAgents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users');
      const deliveryAgents = response.data.filter((user: any) => user.role === 'delivery' && user.isActive);
      return deliveryAgents;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch delivery agents');
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload || [];
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch All Orders
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload || [];
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Order
      .addCase(fetchOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders.unshift(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Order Status
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const { id, status } = action.payload;
        const order = state.orders.find(o => o.id === id);
        if (order) {
          order.status = status.status;
        }
        if (state.currentOrder?.id === id) {
          state.currentOrder.status = status.status;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Assigned Orders
      .addCase(fetchAssignedOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignedOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload || [];
      })
      .addCase(fetchAssignedOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Mark as Delivered
      .addCase(markAsDelivered.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markAsDelivered.fulfilled, (state, action) => {
        state.loading = false;
        const order = state.orders.find(o => o.id === action.payload);
        if (order) {
          order.status = 'delivered';
        }
        if (state.currentOrder?.id === action.payload) {
          state.currentOrder.status = 'delivered';
        }
      })
      .addCase(markAsDelivered.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Assign Order to Delivery
      .addCase(assignOrderToDelivery.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignOrderToDelivery.fulfilled, (state, action) => {
        state.loading = false;
        const order = state.orders.find(o => o.id === action.payload.orderId);
        if (order) {
          order.assignedTo = action.payload.deliveryId;
        }
        if (state.currentOrder?.id === action.payload.orderId) {
          state.currentOrder.assignedTo = action.payload.deliveryId;
        }
      })
      .addCase(assignOrderToDelivery.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Delivery Agents
      .addCase(fetchDeliveryAgents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeliveryAgents.fulfilled, (state, action) => {
        state.loading = false;
        state.deliveryAgents = action.payload;
      })
      .addCase(fetchDeliveryAgents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;
