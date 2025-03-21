import { RouteObject } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import Dashboard from '../pages/Dashboard'
import Users from '../pages/Users'
import Categories from '../pages/Categories'
import Products from '../pages/Products'
import Orders from "../pages/Orders.tsx";
import TaskList from "../pages/TaskList.tsx";

export const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'users', element: <Users /> },
      { path: 'categories', element: <Categories /> },
      { path: 'products', element: <Products /> },
      {path: 'orders', element: <Orders />},
      {path: 'taskList', element: <TaskList />},
    ],
  },
]