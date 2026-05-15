import { useEffect, useState } from "react";
import { getCrops } from "../api/cropApi";

export default function CropRecommendation() {
  const [crops, setCrops] = useState([]);

  useEffect(()=>{
    getCrops().then(res=>setCrops(res.data));
  },[]);

  return (
    <div>
      {crops.map(c=> <p key={c.name}>{c.name}</p>)}
    </div>
  );
}