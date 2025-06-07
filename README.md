# 🗺️ Afghanistan Development Projects Dashboard

An interactive web-based map visualization showing development projects and their impact across Afghanistan's provinces. Built with Next.js, TypeScript, and Mapbox GL JS following modern frontend development best practices.

## ✨ Features

- **Interactive Province Maps**: Click on provinces to view detailed project information
- **Project Visualization**: See project locations with budget and beneficiary data
- **Real-time Data Loading**: Smooth loading indicators for better UX
- **Responsive Design**: Optimized for desktop and mobile devices
- **Modern UI**: Glass-morphism design with dark theme popups
- **Type Safety**: Full TypeScript implementation with proper type definitions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Mapbox Access Token

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd interactive-mapbox-map
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:

   ```env
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css        # Global styles and Tailwind imports
│   │   ├── layout.tsx         # Root layout component
│   │   └── page.tsx           # Home page component
│   ├── components/            # React components
│   │   └── MapboxMap.tsx      # Main map component (TypeScript)
│   └── lib/                   # Utilities and configuration
│       └── config.ts          # Centralized configuration constants
├── public/                    # Static assets
│   └── data.geojson          # Project data
├── package.json              # Dependencies and scripts
└── README.md                 # Project documentation
```

## 🛠️ Technical Implementation

### Architecture Decisions

- **TypeScript**: Full type safety with proper interfaces for GeoJSON data
- **Component Structure**: Modular design with separated concerns
- **Configuration Management**: Centralized constants in `src/lib/config.ts`
- **Environment Variables**: Secure API token management
- **CSS Organization**: Global styles with Tailwind CSS integration
- **Error Handling**: Comprehensive error handling and user feedback

### Key Components

#### MapboxMap Component

- **Type-safe**: Proper TypeScript interfaces for all data structures
- **Modular Methods**: Separated data processing, layer management, and event handling
- **Performance Optimized**: Efficient data fetching with Promise.all()
- **Error Resilient**: Graceful error handling with user feedback

#### Data Processing

- **Async Data Loading**: Parallel fetching of boundary and project data
- **Data Transformation**: Proper GeoJSON processing with unique IDs
- **Statistics Calculation**: Real-time aggregation of budget and beneficiary data

### Styling Architecture

- **Tailwind CSS**: Utility-first CSS framework for rapid development
- **CSS Modules**: Component-scoped styles where needed
- **Glass-morphism**: Modern UI design with backdrop filters
- **Responsive Design**: Mobile-first approach with breakpoints

## 📊 Data Sources

- **Project Data**: `/public/data.geojson` - Development project information
- **Administrative Boundaries**: [geoBoundaries](https://www.geoboundaries.org/) - Afghanistan province boundaries
- **Base Map**: Mapbox Light style for optimal data visualization

## 🎨 UI/UX Features

### Interactive Elements

- **Province Hover Effects**: Visual feedback on mouse interaction
- **Smart Popups**: Positioned to avoid overlap with map features
- **Loading States**: Clear indicators for data loading processes
- **Responsive Popups**: Adaptive sizing for different screen sizes

### Design System

- **Color Palette**: Consistent color scheme for data categories
- **Typography**: System fonts for optimal performance
- **Spacing**: Consistent spacing using Tailwind utilities
- **Animations**: Smooth transitions and loading spinners

## 🔧 Configuration

### Environment Variables

```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_token_here
NODE_ENV=production|development
```

### Map Configuration

Located in `src/lib/config.ts`:

- Map style and center coordinates
- Layer colors and opacity settings
- Data source URLs
- UI configuration options

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Setup

1. Set up production environment variables
2. Configure your hosting platform
3. Ensure Mapbox token is properly configured

### Performance Considerations

- Optimized bundle size with tree shaking
- Lazy loading of map data
- Efficient re-rendering with React hooks
- Compressed assets and images

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Quality

- **TypeScript**: Full type coverage
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting (recommended)
- **Git Hooks**: Pre-commit quality checks (recommended)

## 📱 Browser Support

- Chrome/Chromium 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper TypeScript types
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Mapbox](https://www.mapbox.com/) for mapping services
- [geoBoundaries](https://www.geoboundaries.org/) for administrative boundary data
- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities

---

Built with ❤️ for humanitarian development tracking in Afghanistan.
