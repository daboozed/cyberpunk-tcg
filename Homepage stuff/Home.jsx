import React,{useState} from "react";
import "./theme.css";
export default function Home(){
const [online]=useState(12854);
return <div className="page hero">
<nav className="nav"><div className="brand">NCD TCG</div><div className="menu"><a>Play</a><a>Cards</a><a>Ranked</a><a>Shop</a></div><button className="btn">LOGIN</button></nav>
<section className="heroWrap">
<div><h1>LOL YOUR CREW.</h1><h2>OWN NIGHT CITY.</h2><p>{online} players online now.</p><button className="btn big">PLAY NOW</button></div>
<div className="panel">Season 1 Live • Ranked Queue Open</div>
</section></div>
}