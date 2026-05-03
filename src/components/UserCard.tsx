"use client"
import { useEffect, useState } from "react";
import { dataService } from "@/lib/data-service";

interface userInfo {
  name: string;
  address: string;
  phoneNumber: string;
}

export default function UserCard() {
  const [info, setInfo] = useState<userInfo | null>(null);
  
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const settings = await dataService.getShopSettings();
        if (settings) {
          setInfo({
            name: settings.shop_name,
            address: settings.shop_address,
            phoneNumber: settings.shop_phone,
          });
        }
      } catch (error) {
        console.error("Error fetching info:", error);
      }
    };

    fetchInfo();
  }, []);

  return (
    <div className="print-only title mb-6">
      <span><h1 className="font-bold">{info?.name}</h1></span>
      <span><h1 className="font-bold">{info?.address}</h1></span>
      <span><h1 className="font-bold">{info?.phoneNumber}</h1></span>
    </div>
  );
}
