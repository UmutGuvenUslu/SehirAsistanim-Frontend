import { useState,useEffect } from "react"

function Kutu(){

    const [isim,setIsım] = useState("Ahmet")
    const [sayi,setSayi] = useState(1);



    useEffect(()=>{
        setSayi(sayi+1)
    },[isim])

    return(
       <>
       <h1>Selamlar {isim}</h1>
       <h2>{sayi}</h2>
   
       </>
    )
}

export default Kutu