import { ImageResponse } from "next/og";
export const alt = "DevFlow — a community for developers";
export const size = { width:1200, height:630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(<div style={{display:"flex",flexDirection:"column",justifyContent:"center",width:"100%",height:"100%",background:"#f6f7f9",color:"#242b35",padding:90}}>
    <div style={{fontSize:28,color:"#087f72",letterSpacing:6}}>BUILT FOR DEVELOPERS</div>
    <div style={{fontSize:112,fontWeight:700,marginTop:35}}>DevFlow.</div>
    <div style={{fontSize:36,marginTop:30}}>Ideas worth building. Knowledge worth sharing.</div>
  </div>,size);
}
