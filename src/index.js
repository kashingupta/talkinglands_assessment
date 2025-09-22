import app from './app.js';
const PORT = process.env.PORT || 3000;

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on :${port}`);
});
