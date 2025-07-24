import React from "react";
import {
  MapPinIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ChartBarIcon,
  UserGroupIcon,
  TrashIcon,
  SparklesIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export default function Hakkimizda() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Hero Görsel */}
      <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden mb-20">
        <img
          src="https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?auto=format&fit=crop&w=1470&q=80"
          alt="Şehir Asistanım"
          className="w-full h-full object-cover object-center brightness-75"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-extrabold drop-shadow-lg text-center px-4">
            Şeffaf ve Etkileşimli Bir Şehir Deneyimi
          </h1>
        </div>
      </div>

      {/* İçerik */}
      <main className="pb-28 max-w-6xl mx-auto px-6 space-y-24">
        {/* Başlık */}
        <section className="text-center space-y-6">
          <h2 className="text-4xl font-extrabold text-gray-900">Hakkımızda</h2>
          <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
            <strong>Şehir Asistanım</strong>, vatandaşların belediyelere şikayet, talep ve
            önerilerini CBS (Coğrafi Bilgi Sistemleri) tabanlı harita üzerinden
            iletebileceği, verimli ve şeffaf bir dijital platformdur. Vatandaş
            memnuniyetini artırır, belediyelerin kaynak ve zaman planlamasını
            kolaylaştırır.
          </p>
        </section>

        {/* Avantajlar */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {[
            {
              icon: <ChartBarIcon className="h-12 w-12 text-orange-500 mb-4" />,
              title: "Veri Odaklı Yönetim",
              desc: "Belediyeler için ısı haritası ve mahalle yoğunluk analizleri ile doğru kaynak planlaması sağlar.",
            },
            {
              icon: (
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-orange-500 mb-4" />
              ),
              title: "Anında Geri Bildirim",
              desc: "Vatandaşlar, başvurularının durumunu anlık takip eder, şeffaf ve hızlı iletişim sağlanır.",
            },
            {
              icon: <CheckCircleIcon className="h-12 w-12 text-orange-500 mb-4" />,
              title: "+1 Oylama Sistemi",
              desc: "Tekrar başvurular yerine oylama yaparak sorunların önceliği vurgulanır, veri kirliliği önlenir.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-8 rounded-3xl shadow-md hover:shadow-2xl hover:scale-105 transform transition-all duration-300 text-center"
            >
              {item.icon}
              <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-600 text-base leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </section>

        {/* Şikayet Türleri ve Açıklamaları */}
        <section className="space-y-12">
          <h3 className="text-4xl font-extrabold text-gray-900 text-center">Şikayet Türleri</h3>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
            Aşağıda, platform üzerinden iletebileceğiniz şikayet türleri ve açıklamaları bulunmaktadır.
          </p>

          {/* Şikayet Türleri Kartları */}
          <div className="grid grid-cols-1  sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              {
                icon: <TrashIcon className="h-14 w-14 text-orange-500 mb-5" />,
                title: "Çevre ve Çöp Yönetimi",
                desc: "Çöp toplama, geri dönüşüm ve çevre kirliliği ile ilgili sorunlar.",
              },
              {
                icon: <SparklesIcon className="h-14 w-14 text-orange-500 mb-5" />,
                title: "Elektrik ve Aydınlatma",
                desc: "Sokak lambaları, elektrik kesintileri ve trafolarla ilgili şikayetler.",
              },
              {
                icon: <MapPinIcon className="h-14 w-14 text-orange-500 mb-5" />,
                title: "Altyapı ve Yol Sorunları",
                desc: "Su, kanalizasyon, yol onarımı ve altyapı eksiklikleri.",
              },
              {
                icon: <ShieldCheckIcon className="h-14 w-14 text-orange-500 mb-5" />,
                title: "Güvenlik ve Sokak Hayvanları",
                desc: "Sokak hayvanları, güvenlik önlemleri ve aydınlatma eksiklikleri.",
              },
              {
                icon: <DocumentTextIcon className="h-14 w-14 text-orange-500 mb-5" />,
                title: "Trafik ve Ulaşım Sorunları",
                desc: "Trafik sinyalleri, park sorunları ve ulaşım altyapı eksiklikleri.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center bg-white/70 rounded-2xl p-6 shadow hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300"
              >
                {item.icon}
                <h4 className="text-xl font-semibold mb-2">{item.title}</h4>
                <p className="text-gray-700 text-base">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Hedef Kitle ve Kullanım Kılavuzu */}
        <section className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-3xl p-14 shadow-lg space-y-12">
          <h3 className="text-4xl font-extrabold text-gray-900 text-center">Nasıl Kullanılır?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            {[
              {
                icon: <MapPinIcon className="h-14 w-14 text-orange-500 mb-5" />,
                title: "1. Konum Seç",
                desc: "Haritada nokta ile şikayet/talep alanını belirle.",
              },
              {
                icon: (
                  <ChatBubbleLeftRightIcon className="h-14 w-14 text-orange-500 mb-5" />
                ),
                title: "2. Başvuru Yap",
                desc: "Kategoriyi seç, açıklama ekle ve gönder.",
              },
              {
                icon: <CheckCircleIcon className="h-14 w-14 text-orange-500 mb-5" />,
                title: "3. Takip Et",
                desc: "Başvurunun durumunu anlık olarak takip et, bildirimler al.",
              },
              {
                icon: <UserGroupIcon className="h-14 w-14 text-orange-500 mb-5" />,
                title: "4. Oyla & Destekle",
                desc: "Aynı sorunu yaşayanlar +1 oylayarak önceliği artırabilir.",
              },
            ].map((step, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center bg-white/70 rounded-2xl p-6 shadow hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300"
              >
                {step.icon}
                <h4 className="text-xl font-semibold mb-2">{step.title}</h4>
                <p className="text-gray-700 text-base">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
