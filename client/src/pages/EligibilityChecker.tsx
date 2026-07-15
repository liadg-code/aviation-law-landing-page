import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useState, useMemo } from "react";

export default function EligibilityChecker() {
  const [flightStatus, setFlightStatus] = useState("");
  const [flightDate, setFlightDate] = useState("");
  const [notificationDate, setNotificationDate] = useState("");
  const [delayHours, setDelayHours] = useState("");
  const [destination, setDestination] = useState("אירופה");
  const [reasonForClaim, setReasonForClaim] = useState("");
  const [hasCompensation, setHasCompensation] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", phone: "", email: "", notes: "" });

  // Calculate days between flight date and notification date
  const daysNotified = useMemo(() => {
    if (!flightDate || !notificationDate) return null;
    const flight = new Date(flightDate);
    const notification = new Date(notificationDate);
    
    // Check if notification date is after flight date
    if (notification > flight) {
      return "invalid";
    }
    
    const diffTime = Math.abs(notification.getTime() - flight.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [flightDate, notificationDate]);

  const getCompensationRange = (destination: string) => {
    const ranges: { [key: string]: { min: number; max: number } } = {
      "אירופה": { min: 1530, max: 2450 },
      "אמריקה (צפון ודרום)": { min: 2450, max: 3670 },
      "אסיה": { min: 2450, max: 3670 },
      "אפריקה": { min: 1530, max: 2450 },
      "אוקיאניה": { min: 3670, max: 3670 },
    };
    return ranges[destination] || { min: 1530, max: 2450 };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let eligibilityResult: any = {
      isEligible: false,
      message: "",
      rights: [],
      compensation: null,
    };

    // Flight on time
    if (flightStatus === "on-time") {
      if (reasonForClaim === "overbooking") {
        eligibilityResult = {
          isEligible: true,
          message: "אתה זכאי לפיצוי בגין סירוב להסיע נוסע",
          rights: [
            "שירותי סיוע (מזון, משקאות, תקשורת)",
            "השבת תמורה או טיסה חלופית",
            "פיצוי כספי לפי חוק שירותי התעופה",
          ],
        };
      } else if (reasonForClaim === "ticket-change") {
        eligibilityResult = {
          isEligible: true,
          message: "אתה זכאי לפיצוי בגין שינוי בתנאי הכרטיס",
          rights: [
            "החזר על הפרש בתמורה או טיסה חלופית",
            "שירותי סיוע אם היה עיכוב",
          ],
        };
      } else if (reasonForClaim === "connection-change") {
        eligibilityResult = {
          isEligible: true,
          message: "הטיסה שלך שונתה מטיסה ישירה לטיסה עם עצירת ביניים, ייתכן שמדובר בשינוי המזכה בפיצוי",
          rights: [
            "החזר על הפרש בתמורה או טיסה חלופית",
            "שירותי סיוע אם היה עיכוב",
            "פיצוי נוסף בהתאם למשך העיכוב",
          ],
        };
      }
    }

    // Flight cancelled
    else if (flightStatus === "cancelled") {
      if (daysNotified === null || daysNotified === "invalid" || daysNotified > 14) {
        eligibilityResult = {
          isEligible: false,
          message: "לפי הנתונים שהוזנו, לא נמצאה זכאות לפיצוי מידי",
          rights: [
            "עם זאת, כדאי ליצור קשר איתנו לבדיקה פרטנית של המקרה שלך.",
          ],
        };
      } else {
        const range = getCompensationRange(destination);
        eligibilityResult = {
          isEligible: true,
          message: "אתה זכאי לפיצוי מלא בגין ביטול טיסה",
          rights: [
            "שירותי סיוע (מזון, משקאות, תקשורת)",
            "החזר על כרטיס הטיסה או טיסה חלופית",
            `פיצוי כספי בטווח של ₪${range.min}-₪${range.max} (לפי יעד הטיסה)`,
          ],
          compensation: range,
        };
      }
    }

    // Flight advanced
    else if (flightStatus === "advanced") {
      if (daysNotified === null || daysNotified === "invalid" || daysNotified > 14) {
        eligibilityResult = {
          isEligible: false,
          message: "לפי הנתונים שהוזנו, לא נמצאה זכאות לפיצוי מידי",
          rights: [
            "עם זאת, כדאי ליצור קשר איתנו לבדיקה פרטנית של המקרה שלך.",
          ],
        };
      } else if (delayHours === "") {
        eligibilityResult = {
          isEligible: false,
          message: "אנא הזן את מספר השעות של ההקדמה",
          rights: [],
        };
      } else {
        const hours = parseInt(delayHours);
        if (hours < 5) {
          eligibilityResult = {
            isEligible: false,
            message: "לפי הנתונים שהוזנו, לא נמצאה זכאות לפיצוי מידי",
            rights: [
              "עם זאת, כדאי ליצור קשר איתנו לבדיקה פרטנית של המקרה שלך.",
            ],
          };
        } else if (hours >= 5 && hours < 8) {
          eligibilityResult = {
            isEligible: true,
            message: "אתה זכאי לפיצוי בגין הקדמת טיסה",
            rights: [
              "החזר על כרטיס הטיסה או טיסה חלופית",
            ],
          };
        } else {
          const range = getCompensationRange(destination);
          eligibilityResult = {
            isEligible: true,
            message: "אתה זכאי לפיצוי מלא בגין הקדמת טיסה",
            rights: [
              "החזר על כרטיס הטיסה או טיסה חלופית",
              `פיצוי כספי בטווח של ₪${range.min}-₪${range.max} (לפי יעד הטיסה)`,
            ],
            compensation: range,
          };
        }
      }
    }

    // Flight delayed
    else if (flightStatus === "delayed") {
      if (daysNotified === null || daysNotified === "invalid" || daysNotified > 14) {
        eligibilityResult = {
          isEligible: false,
          message: "לפי הנתונים שהוזנו, לא נמצאה זכאות לפיצוי מידי",
          rights: [
            "עם זאת, כדאי ליצור קשר איתנו לבדיקה פרטנית של המקרה שלך.",
          ],
        };
      } else if (delayHours === "") {
        eligibilityResult = {
          isEligible: false,
          message: "אנא הזן את מספר שעות העיכוב",
          rights: [],
        };
      } else {
        const hours = parseInt(delayHours);
        if (hours < 2) {
          eligibilityResult = {
            isEligible: false,
            message: "לפי הנתונים שהוזנו, לא נמצאה זכאות לפיצוי מידי",
            rights: [
              "עם זאת, כדאי ליצור קשר איתנו לבדיקה פרטנית של המקרה שלך.",
            ],
          };
        } else if (hours >= 2 && hours < 5) {
          eligibilityResult = {
            isEligible: true,
            message: "אתה זכאי לשירותי סיוע",
            rights: [
              "שירותי סיוע (מזון, משקאות, תקשורת)",
            ],
          };
        } else if (hours >= 5 && hours < 8) {
          eligibilityResult = {
            isEligible: true,
            message: "אתה זכאי לשירותי סיוע והחזר",
            rights: [
              "שירותי סיוע (מזון, משקאות, תקשורת)",
              "החזר על כרטיס הטיסה או טיסה חלופית",
            ],
          };
        } else {
          const range = getCompensationRange(destination);
          eligibilityResult = {
            isEligible: true,
            message: "אתה זכאי לפיצוי מלא בגין עיכוב טיסה",
            rights: [
              "שירותי סיוע (מזון, משקאות, תקשורת)",
              "החזר על כרטיס הטיסה או טיסה חלופית",
              `פיצוי כספי בטווח של ₪${range.min}-₪${range.max} (לפי יעד הטיסה)`,
            ],
            compensation: range,
          };
        }
      }
    }

    setResults(eligibilityResult);
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1e3a5f] mb-2">בדוק את זכאותך לפיצוי</h1>
          <p className="text-[#6b6b6b]">מלא את הטופס למטה כדי לבדוק אם אתה זכאי לפיצוי בגין בעיות בטיסה שלך</p>
        </div>

        <Card className="border-[#e8e7e5]">
          <CardHeader>
            <CardTitle className="text-[#1e3a5f]">פרטי הטיסה</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Destination - First Question */}
              <div>
                <label className="block text-sm font-medium text-[#1e3a5f] mb-2">
                  לאן הטיסה הייתה?
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-4 py-2 border border-[#e8e7e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                >
                  <option value="אירופה">אירופה</option>
                  <option value="אמריקה (צפון ודרום)">אמריקה (צפון ודרום)</option>
                  <option value="אסיה">אסיה</option>
                  <option value="אפריקה">אפריקה</option>
                  <option value="אוקיאניה">אוקיאניה</option>
                </select>
              </div>

              {/* Flight Status */}
              <div>
                <label className="block text-sm font-medium text-[#1e3a5f] mb-2">
                  מה היה סטטוס הטיסה?
                </label>
                <select
                  value={flightStatus}
                  onChange={(e) => {
                    setFlightStatus(e.target.value);
                    setFlightDate("");
                    setNotificationDate("");
                    setDelayHours("");
                    setReasonForClaim("");
                  }}
                  className="w-full px-4 py-2 border border-[#e8e7e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                >
                  <option value="">בחר אפשרות</option>
                  <option value="cancelled">הטיסה בוטלה</option>
                  <option value="delayed">הטיסה המריאה באיחור</option>
                  <option value="advanced">הטיסה הוקדמה</option>
                  <option value="on-time">הטיסה המריאה בזמן</option>
                </select>
              </div>

              {/* Reason for Claim (if on-time) */}
              {flightStatus === "on-time" && (
                <div>
                  <label className="block text-sm font-medium text-[#1e3a5f] mb-2">
                    מה סיבת הפניה?
                  </label>
                  <select
                    value={reasonForClaim}
                    onChange={(e) => setReasonForClaim(e.target.value)}
                    className="w-full px-4 py-2 border border-[#e8e7e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                  >
                    <option value="">בחר אפשרות</option>
                    <option value="overbooking">סירוב להסיע נוסע (overbooking)</option>
                    <option value="ticket-change">שינוי בתנאי כרטיס הטיסה</option>
                    <option value="connection-change">העברה מטיסה ישירה לטיסה עם עצירת ביניים</option>
                  </select>
                </div>
              )}

              {/* Flight Date and Notification Date (if cancelled, advanced, or delayed) */}
              {(flightStatus === "cancelled" || flightStatus === "advanced" || flightStatus === "delayed") && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#1e3a5f] mb-2">
                      מה היה תאריך הטיסה?
                    </label>
                    <input
                      type="date"
                      value={flightDate}
                      onChange={(e) => setFlightDate(e.target.value)}
                      className="w-full px-4 py-2 border border-[#e8e7e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1e3a5f] mb-2">
                      באיזה תאריך נודע לך על השינוי?
                    </label>
                    <input
                      type="date"
                      value={notificationDate}
                      onChange={(e) => setNotificationDate(e.target.value)}
                      className="w-full px-4 py-2 border border-[#e8e7e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                    />
                  </div>

                  {daysNotified !== null && daysNotified !== "invalid" && (
                    <div className="text-sm text-[#6b6b6b] bg-[#f5f5f5] p-3 rounded-lg">
                      מספר הימים: <strong>{daysNotified} ימים</strong>
                    </div>
                  )}
                  {daysNotified === "invalid" && (
                    <div className="text-sm text-red-600 bg-[#f5f5f5] p-3 rounded-lg">
                      לא יתכן שתאריך ההודעה על השינוי מאוחר לתאריך הטיסה
                    </div>
                  )}
                </>
              )}

              {/* Delay/Advance Hours (if delayed or advanced with 0-14 days) */}
              {daysNotified !== null && daysNotified !== "invalid" && daysNotified <= 14 && (flightStatus === "delayed" || flightStatus === "advanced") && (
                <div>
                  <label className="block text-sm font-medium text-[#1e3a5f] mb-2">
                    {flightStatus === "delayed" ? "כמה שעות עיכוב?" : "כמה שעות הקדמה?"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={delayHours}
                    onChange={(e) => setDelayHours(e.target.value)}
                    placeholder="הכניסו מספר שעות"
                    className="w-full px-4 py-2 border border-[#e8e7e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                  />
                </div>
              )}

              {/* Already Received Compensation */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasCompensation"
                  checked={hasCompensation}
                  onChange={(e) => setHasCompensation(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="hasCompensation" className="text-sm text-[#6b6b6b]">
                  כבר קיבלתי פיצוי
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-[#1e3a5f] hover:bg-[#152847] text-white py-3 rounded-lg font-medium transition-colors"
              >
                בדוק את הזכאות שלי
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <div className="mt-8 space-y-6">
            <Card className={`border-l-4 ${results.isEligible ? "border-l-green-500 border-[#e8e7e5]" : "border-l-orange-500 border-[#e8e7e5]"}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {results.isEligible ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-orange-500" />
                  )}
                  <CardTitle className="text-[#1e3a5f]">
                    {results.isEligible ? "אתה כנראה זכאי!" : "לא נמצאה זכאות"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[#6b6b6b]">{results.message}</p>

                {results.compensation && (
                  <div className="bg-[#f5f5f5] p-4 rounded-lg border border-[#e8e7e5]">
                    <p className="text-sm text-[#6b6b6b] mb-2">טווח פיצוי משוער:</p>
                    <p className="text-2xl font-bold text-[#1e3a5f]">
                      ₪{results.compensation.min}-₪{results.compensation.max}
                    </p>
                    {hasCompensation && (
                      <p className="text-xs text-[#6b6b6b] mt-3">
                        אם קיבלתם כבר פיצוי, הסכום הסופי שמגיע לכם יהיה <strong>בניכוי הפיצוי שכבר התקבל</strong>.
                      </p>
                    )}
                  </div>
                )}

                {results.rights.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-[#1e3a5f] mb-3">הצעדים הבאים:</p>
                    <ul className="space-y-2">
                      {results.rights.map((right: string, index: number) => (
                        <li key={index} className="flex items-start gap-3 text-sm text-[#6b6b6b]">
                          <span className="text-[#d4a574] font-bold mt-1">✓</span>
                          <span>{right}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  onClick={() => setShowContactModal(true)}
                  className="w-full bg-[#d4a574] hover:bg-[#c49564] text-white py-3 rounded-lg font-medium transition-colors mt-4"
                >
                  צור קשר עכשיו
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contact Modal */}
        {showContactModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto border-[#e8e7e5]">
              <CardHeader>
                <CardTitle className="text-[#1e3a5f]">פרטי הטיסה שלך</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary of flight details */}
                <div className="bg-[#f5f5f5] p-4 rounded-lg space-y-2 text-sm">
                  <p><strong>יעד:</strong> {destination}</p>
                  <p><strong>סטטוס:</strong> {flightStatus === "cancelled" ? "בוטלה" : flightStatus === "delayed" ? "עיכוב" : flightStatus === "advanced" ? "הקדמה" : "בזמן"}</p>
                  {flightDate && <p><strong>תאריך הטיסה:</strong> {flightDate}</p>}
                  {notificationDate && <p><strong>תאריך ההודעה:</strong> {notificationDate}</p>}
                  {daysNotified !== null && <p><strong>ימים:</strong> {daysNotified}</p>}
                  {delayHours && <p><strong>שעות:</strong> {delayHours}</p>}
                  {results?.compensation && (
                    <p><strong>טווח פיצוי:</strong> ₪{results.compensation.min}-₪{results.compensation.max}</p>
                  )}
                </div>

                {/* Contact form */}
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1e3a5f] mb-2">שם מלא</label>
                    <input
                      type="text"
                      dir="rtl"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="הכניסו את שמכם"
                      className="w-full px-4 py-2 border border-[#e8e7e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1e3a5f] mb-2">טלפון</label>
                    <input
                      type="tel"
                      dir="rtl"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="הכניסו את מספר הטלפון"
                      className="w-full px-4 py-2 border border-[#e8e7e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1e3a5f] mb-2">דוא"ל</label>
                    <input
                      type="email"
                      dir="rtl"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="הכניסו את כתובת המייל"
                      className="w-full px-4 py-2 border border-[#e8e7e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1e3a5f] mb-2">הערות נוספות</label>
                    <textarea
                      dir="rtl"
                      value={contactForm.notes}
                      onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                      placeholder="הוסיפו כל הסבר או מלל נוסף אודות המקרה שלכם"
                      className="w-full px-4 py-2 border border-[#e8e7e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a574] resize-none h-24"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => setShowContactModal(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-black py-2 rounded-lg font-medium transition-colors"
                  >
                    ביטול
                  </Button>
                  <Button
                    onClick={() => {
                      // Form submission is handled by the form element itself
                      alert("הבקשה שלך נשלחה בהצלחה!");
                      setShowContactModal(false);
                    }}
                    className="flex-1 bg-[#1e3a5f] hover:bg-[#152847] text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    שלח
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
