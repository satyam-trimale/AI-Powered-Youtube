# AI-Powered YouTube Clone

A full-stack video-sharing platform that leverages AI to automate video metadata creation and enhance the upload experience. Easily upload videos, generate AI-powered titles, descriptions, and thumbnails, and manage your content—just like YouTube, but smarter.

---

## 🚀 Features

- **User Authentication**: Secure signup and login flows.
- **Video Upload**: Upload videos with robust Cloudinary storage integration.
- **AI-Powered Metadata**: Instantly generate video titles and descriptions using Gemini 1.5 Flash (Google Generative AI).
- **Thumbnail Generation**: Extract a frame from the uploaded video and add a title overlay using Cloudinary’s image transformation API.
- **Modern Frontend**: Responsive UI built with React and TailwindCSS.
- **RESTful API**: Scalable backend built on Express.js and Node.js.

---

## 🛠️ Tech Stack

| Layer      | Technologies/Services                          |
|------------|-----------------------------------------------|
| Frontend   | React.js, TailwindCSS, Axios                  |
| Backend    | Node.js, Express.js                           |
| AI         | Google Generative AI SDK (Gemini API)         |
| Storage    | Cloudinary                                    |
| Image Proc | Cloudinary (frame extraction & text overlay)   |

---

## 📁 Folder Structure

```
.
├── Frontend/       # React frontend (UI)
├── Backend/        # Node.js backend (routes, controllers, services)
├── README.md
└── ...
```
- **Secrets**: Use `.env` files in both `Frontend/` and `Backend/` for API keys and secrets.

---

## ⚡ Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/satyam-trimale/AI-Powered-Youtube.git
   cd AI-Powered-Youtube
   ```

2. **Install dependencies**

   - Frontend:
     ```bash
     cd Frontend
     npm install
     ```
   - Backend:
     ```bash
     cd ../Backend
     npm install
     ```

3. **Configure Environment Variables**

   - Create `.env` files in both `Frontend/` and `Backend/` directories.
   - Add keys for:
     - Google Gemini AI API
     - Cloudinary credentials
     - JWT secrets, etc.

4. **Run the Application**

   - Start backend server:
     ```bash
     cd Backend
     npm start
     ```
   - Start frontend:
     ```bash
     cd ../Frontend
     npm start
     ```
   - Visit the app at [http://localhost:3000](http://localhost:3000)

---

## 🔮 Future Roadmap

- AI-generated voiceovers for videos
- Video recommendations powered by ML
- User playlists & subscriptions
- Advanced search (semantic & tag-based)
- Analytics dashboard for creators

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a [pull request](https://github.com/satyam-trimale/AI-Powered-Youtube/pulls)

---

## 📸 Screenshots

<!-- Add screenshots of your UI here -->
<!-- Example: -->
<!-- ![Home Page](screenshots/home.png) -->

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 💬 Contact

For questions or support, open an issue or reach out via [GitHub Issues](https://github.com/satyam-trimale/AI-Powered-Youtube/issues).

