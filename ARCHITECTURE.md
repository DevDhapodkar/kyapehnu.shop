# Kya Pehnu? - Architecture & System Blueprint

## Core Concept
A hyper-local fashion delivery aggregator (Swiggy/Zomato model) for independent clothing retailers in Nagpur. 

## Design System
- Aesthetic: Minimalist, luxury shopping (obsidian, charcoal, monochrome accents).
- UI Elements: Heavy use of Glassmorphism (frosted glass, blurs).

## Project Structure (Monorepo)
1. `/backend` - Node.js/Express server handling logistics, databases, and webhooks.
2. `/customer-app` - React Native (Expo) app for buyers.
3. `/vendor-app` - React Native (Expo) app for shop owners.

## Component Specifications

### 1. Customer App (Frontend)
- Tech: Expo, React Native Reanimated, React Three Fiber (R3F), Expo GL.
- Intro Sequence: 3D scrollytelling home page. Drone-shot camera tied to scroll position, orbiting a low-poly 3D black men's shirt, then a red dress. 
- E-commerce Loop: Auto-fetch GPS location, index nearby local fashion items, Product Detail Pages (PDP), global cart state, checkout, and live map tracking for delivery.

### 2. Vendor Operations (Frontend)
- Tech: Expo, React Native.
- Features: Catalog management, real-time incoming order alerts, order status toggles (Accept, Ready for Pickup).

### 3. Backend & Logistics (Node.js)
- Database: MongoDB Atlas (Schemas: Users, Vendors, Products, Orders).
- Auth & Real-time: Firebase Auth and Cloud Messaging for real-time app notifications.
- Porter API: Triggered automatically to dispatch a driver when a vendor marks an order as "Ready".
- WhatsApp Integration: Webhook via WhatsApp Cloud API to instantly message the vendor's phone upon new order placement. Also letting vendor add their products/ manage inventory via Whatsapp