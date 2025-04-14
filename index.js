// index.js
import express from 'express';
import cors from 'cors';
import varzeshRoutes from './routes/varzesh.js'; // Adjust path if needed

const app = express();
app.use(cors());
const port = process.env.PORT || 3000;
app.use(express.json());

app.use('/varzesh', varzeshRoutes); // Mount the varzesh routes under the '/varzesh' path

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});