# Discofy - create Spotify playlists from your Discogs record collection

Discofy is a web application that lets users create Spotify playlists from their personal Discogs libraries. This project serves as the user interface for the Discofy and communicates with a Flask backend.

> **Backend:** The Flask backend is in a separate repository: [Discofy Backend](https://github.com/oskarprzybylski23/Discofy)
## 🖼Demo

<div>
    <a href="https://www.loom.com/share/13052ba3d5284f97bd7aa994ac213298" target="_blank">
      <p>Discofy Demo 2.0 - Watch Video</p>
    </a>
    <a href="https://www.loom.com/share/13052ba3d5284f97bd7aa994ac213298" target="_blank">
      <img style="max-width:300px;" src="https://cdn.loom.com/sessions/thumbnails/13052ba3d5284f97bd7aa994ac213298-f9009e6e37778c29-full-play.gif">
    </a>
  </div>

## 🏗️ Architecture

- **Frontend:**  
  Built with [React](https://react.dev/) and [Vite](https://vitejs.dev/), styled using [Tailwind CSS](https://tailwindcss.com/), and leverages [Shadcn/ui](https://ui.shadcn.com/) component library.

- **Backend:**  
  The backend is a Flask application.  
  👉 **[Discofy Backend Repository](https://github.com/oskarprzybylski23/Discofy)**

- **Communication:**  
  The frontend communicates with the backend via RESTful API calls (using Axios).

---

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- Access to the [Discofy Backend](https://github.com/your-org/discofy-backend) (running locally or remotely)

---

## 🚀 Local Development Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-org/discofy-frontend.git
   cd discofy-frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   - Create a `.env` file in the root directory.
   - Add the backend API URL and any other required variables:

     ```
     VITE_API_URL=http://localhost:5000

     ```

4. **Start the development server:**

   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:5173](http://localhost:5173) by default.

5. **(Optional) Run the backend:**
   - Follow the instructions in the [backend repo](https://github.com/your-org/discofy-backend) to start the Flask server.

---

## 🤝 Contributing

Contributions are welcome. Feel free to suggest new features or report bugs in [Issues](https://github.com/oskarprzybylski23/Discofy/issues). To contribute code:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add YourFeature'`)
4. Push to your branch (`git push origin feature/YourFeature`)
5. Open a pull request

Please follow the existing code style and conventions. For major changes, open an issue first to discuss your ideas.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for details.
