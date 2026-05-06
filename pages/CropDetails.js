import { useParams } from "react-router-dom";

export default function CropDetails() {
  const { id } = useParams();

  return (
    <div style={{ padding: "30px" }}>
      <h2>🌾 Crop Details</h2>
      <p>Crop ID: {id}</p>

      <p>Detailed AI insights will be shown here.</p>
    </div>
  );
}