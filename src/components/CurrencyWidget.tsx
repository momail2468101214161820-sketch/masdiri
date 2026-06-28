import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Rate {
  name: string;
  buy: string;
  sell: string;
  trend: "up" | "down";
}

export const DEFAULT_RATES: Rate[] = [
  { name: "الدولار الأمريكي", buy: "50.50", sell: "50.80", trend: "up" },
  { name: "اليورو", buy: "54.20", sell: "54.60", trend: "down" },
  { name: "الريال السعودي", buy: "13.45", sell: "13.55", trend: "up" },
  { name: "الدرهم الإماراتي", buy: "13.75", sell: "13.85", trend: "up" },
  { name: "الجنيه الإسترليني", buy: "63.40", sell: "63.80", trend: "up" },
  { name: "الدينار الكويتي", buy: "164.20", sell: "164.90", trend: "down" },
  { name: "ذهب عيار 24", buy: "5450", sell: "5500", trend: "up" },
  { name: "ذهب عيار 21", buy: "4770", sell: "4810", trend: "up" },
  { name: "ذهب عيار 18", buy: "4090", sell: "4125", trend: "up" },
  { name: "الجنيه الذهب", buy: "38160", sell: "38500", trend: "up" },
  { name: "أوقية الذهب (عالمي)", buy: "2640", sell: "2655", trend: "down" },
];


const CurrencyWidget = () => {
  const [rates, setRates] = useState<Rate[]>(DEFAULT_RATES);
  const [updatedAt, setUpdatedAt] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("admin_settings")
        .select("value, updated_at")
        .eq("key", "currency_rates")
        .maybeSingle();
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          if (Array.isArray(parsed) && parsed.length) setRates(parsed);
        } catch {}
        if (data.updated_at) {
          setUpdatedAt(new Date(data.updated_at).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }));
        }
      }
    })();
  }, []);

  return (
    <div className="border border-border p-4">
      <h3 className="newspaper-heading text-base text-center border-b-2 border-foreground pb-2 mb-3">
        أسعار العملات والذهب اليوم
      </h3>

      {updatedAt && <p className="text-muted-foreground text-xs text-center mb-3">{updatedAt}</p>}
      <div className="space-y-2">
        {rates.map((rate) => (
          <div key={rate.name} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
            <div className="flex items-center gap-1">
              {rate.trend === "up" ? (
                <TrendingUp size={12} className="text-primary" />
              ) : (
                <TrendingDown size={12} className="text-destructive" />
              )}
              <span className="font-semibold">{rate.name}</span>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>ش: <b className="text-foreground">{rate.buy}</b></span>
              <span>ب: <b className="text-foreground">{rate.sell}</b></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurrencyWidget;
