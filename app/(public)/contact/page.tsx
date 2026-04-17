import { Mail, Phone, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ContactPage() {
  const t = await getTranslations("contactPage");

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t("hero.title")}</h1>
          <p className="text-xl text-muted-foreground">
            {t("hero.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>{t("form.title")}</CardTitle>
              <CardDescription>
                {t("form.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="name">{t("form.fields.name")}</Label>
                  <Input id="name" placeholder={t("form.placeholders.name")} />
                </div>

                <div>
                  <Label htmlFor="email">{t("form.fields.email")}</Label>
                  <Input id="email" type="email" placeholder={t("form.placeholders.email")} />
                </div>

                <div>
                  <Label htmlFor="phone">{t("form.fields.phone")}</Label>
                  <Input id="phone" type="tel" placeholder="+213 XX XXX XXXX" />
                </div>

                <div>
                  <Label htmlFor="message">{t("form.fields.message")}</Label>
                  <Textarea 
                    id="message" 
                    placeholder={t("form.placeholders.message")} 
                    rows={5}
                  />
                </div>

                <Button type="submit" className="w-full">
                  {t("form.submit")}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("info.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t("info.phoneLabel")}</h3>
                    <p className="text-muted-foreground">+213 XX XXX XXXX</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t("info.emailLabel")}</h3>
                    <p className="text-muted-foreground">contact@sultanacc.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t("info.addressLabel")}</h3>
                    <p className="text-muted-foreground">{t("info.addressValue")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("hours.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("hours.weekdaysLabel")}</span>
                    <span className="font-semibold">9:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("hours.saturdayLabel")}</span>
                    <span className="font-semibold">9:00 - 14:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("hours.sundayLabel")}</span>
                    <span className="font-semibold">{t("hours.closed")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Map or Additional Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{t("quickFaq.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">{t("quickFaq.q1.question")}</h4>
                <p className="text-muted-foreground">
                  {t("quickFaq.q1.answer")}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t("quickFaq.q2.question")}</h4>
                <p className="text-muted-foreground">
                  {t("quickFaq.q2.answer")}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t("quickFaq.q3.question")}</h4>
                <p className="text-muted-foreground">
                  {t("quickFaq.q3.answer")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
