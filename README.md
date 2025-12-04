# PG Booking Mobile App 📱

A comprehensive React Native mobile application built with Expo for booking and managing Paying Guest (PG) accommodations. This app connects students and professionals with suitable PG options, allowing them to search, filter, and book accommodations based on their preferences.

## 🌟 Features

### For Users

- **Authentication System**: Secure login and registration with JWT tokens
- **Smart Search & Filters**: Find PGs by area, gender type, budget, and amenities
- **Detailed PG Listings**: View comprehensive information including photos, rooms, pricing, and amenities
- **Booking System**: Request and manage PG bookings
- **Image Gallery**: Browse multiple photos of each PG
- **Real-time Availability**: Check available beds in different room types

### For PG Owners

- **PG Management**: Add, edit, and manage multiple PG properties
- **Booking Management**: View and handle booking requests
- **Image Uploads**: Upload multiple photos for each PG listing
- **Room Configuration**: Set up different room types with pricing and availability

## 🛠️ Tech Stack

- **Framework**: Expo SDK ~54.0
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **UI Components**: React Native
- **HTTP Client**: Axios
- **Storage**: AsyncStorage
- **Image Handling**: Expo Image Picker
- **State Management**: React Hooks

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Expo Go app (for testing on physical device)
- Android Studio (for Android emulator) or Xcode (for iOS simulator)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/sainath-666/mobile-app.git
cd mobile-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Backend Connection

Update the backend API URL in `lib/api.ts`:

```typescript
const BASE_URL = "http://YOUR_IP_ADDRESS:5000"; // Replace with your backend IP
```

**Important**:

- For physical devices: Use your computer's local IP address (find it using `ipconfig` on Windows or `ifconfig` on Mac/Linux)
- For Android Emulator: Use `http://10.0.2.2:5000`
- For iOS Simulator: Use `http://localhost:5000`

### 4. Start the Backend Server

Navigate to the backend directory and start the server:

```bash
cd ../backend-pg
npm install
npm start
```

The backend should be running on `http://localhost:5000`

### 5. Start the Mobile App

```bash
npm start
```

### 6. Run on Device/Emulator

Choose one of the following options:

- **Expo Go (Physical Device)**:

  - Install Expo Go from App Store (iOS) or Play Store (Android)
  - Scan the QR code from the terminal
  - Ensure your phone and computer are on the same WiFi network

- **Android Emulator**:

  ```bash
  npm run android
  ```

- **iOS Simulator** (Mac only):
  ```bash
  npm run ios
  ```

## 📁 Project Structure

```
mobile-app/
├── app/                        # Main application screens (file-based routing)
│   ├── _layout.tsx            # Root layout
│   ├── login.tsx              # Login/Register screen
│   ├── (tabs)/                # Tab navigation
│   │   ├── index.tsx          # Home screen (PG listings)
│   │   └── explore.tsx        # Explore screen
│   ├── owner/                 # Owner-specific screens
│   │   └── pgs.tsx            # Manage PGs
│   └── pg/                    # PG detail screens
│       └── [id].tsx           # Dynamic PG details page
├── components/                 # Reusable UI components
├── lib/                       # Utilities and configurations
│   ├── api.ts                 # Axios API configuration
│   └── authStorage.ts         # AsyncStorage helpers
├── constants/                 # Theme and constants
├── hooks/                     # Custom React hooks
└── assets/                    # Images and static files
```

## 🔑 Key Features Implementation

### Authentication

- JWT-based authentication
- Persistent login using AsyncStorage
- Role-based access (User/Owner)

### PG Search & Filtering

- Search by area/city
- Filter by gender type (Boys/Girls/Co-ed)
- Filter by food availability
- Budget-based filtering
- Amenity-based filtering

### Booking Flow

1. User browses PG listings
2. Views detailed PG information
3. Selects room type and checks availability
4. Submits booking request
5. Owner reviews and approves/rejects

## 📱 Available Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm start`       | Start Expo development server  |
| `npm run android` | Run on Android emulator/device |
| `npm run ios`     | Run on iOS simulator/device    |
| `npm run web`     | Run in web browser             |
| `npm run lint`    | Run ESLint                     |

## 🐛 Troubleshooting

### Network Error

- Ensure backend server is running
- Verify the IP address in `lib/api.ts` matches your computer's IP
- Check that phone and computer are on the same WiFi network
- For Android emulator, use `http://10.0.2.2:5000`

### Connection Timeout

- Increase timeout in `lib/api.ts` (currently set to 10000ms)
- Check firewall settings

### Expo Login Issues

- Run `npx expo login` and authenticate with your Expo account
- Clear Expo cache: `npx expo start -c`

## 🔐 Environment Variables (Optional)

You can set environment variables for different environments:

```bash
EXPO_PUBLIC_API_BASE_URL=http://your-api-url:5000
```

## 📚 API Endpoints

The app connects to the following backend endpoints:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/pgs` - Get all PGs (with filters)
- `GET /api/pgs/:id` - Get PG details
- `POST /api/pgs` - Create new PG (owner only)
- `POST /api/bookings` - Create booking request
- `POST /api/uploads` - Upload images

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Sainath**

- GitHub: [@sainath-666](https://github.com/sainath-666)

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev)
- UI inspiration from modern accommodation booking apps
- Backend powered by Node.js and MongoDB

## 📞 Support

For support, email sai65265@gmail.com or open an issue in the GitHub repository.

---

Made with ❤️ for the PG community
