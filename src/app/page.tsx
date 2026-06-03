import Link from "next/link";
import { Gamepad2, ArrowRight, Code, Cpu, Layers, Zap, BookOpen, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { projects, getDifficultyStars } from "@/lib/projects";

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A2E] via-background to-[#0d1b2a]" />
        <div className="absolute top-1/4 left-1/4 size-96 rounded-full bg-[#478CBF]/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 size-64 rounded-full bg-[#45B853]/8 blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="flex flex-col items-center justify-center gap-6 px-4 py-20 md:py-32 text-center">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm">
          <Gamepad2 className="size-3.5 text-[#478CBF]" />
          Бесплатный курс
        </Badge>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Научись создавать игры на{" "}
          <span className="text-[#478CBF]">Godot Engine</span>
        </h1>

        <p className="max-w-xl text-lg text-muted-foreground md:text-xl">
          Единственный русскоязычный курс с переходом от GDScript к C++. От
          кликера до 3D приключения — 6 проектов, один путь.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          <Link href="/learn">
            <Button size="lg" className="gap-2 bg-[#478CBF] hover:bg-[#478CBF]/80 text-white px-6">
              Начать обучение
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="https://godotengine.org" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="gap-2 px-6">
              Узнать о Godot
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BookOpen className="size-4 text-[#478CBF]" />
            6 проектов
          </span>
          <span className="flex items-center gap-1.5">
            <Code className="size-4 text-[#45B853]" />
            GDScript + C++
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="size-4 text-yellow-500" />
            Практика с нуля
          </span>
        </div>
      </div>
    </section>
  );
}

function ProjectsSection() {
  return (
    <section className="px-4 md:px-6 py-16 max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight">Проекты курса</h2>
        <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
          Каждый проект — это полноценная игра. От простого кликера до
          высокопроизводительного C++ демо.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {projects.map((project) => (
          <Link key={project.slug} href={`/learn/${project.slug}`} className="group">
            <Card className="h-full transition-all duration-200 hover:border-[#478CBF]/50 hover:shadow-lg hover:shadow-[#478CBF]/5 group-hover:scale-[1.01]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{project.icon}</span>
                  <Badge variant="outline" className="text-xs">
                    {project.language}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-2">{project.title}</CardTitle>
                <CardDescription className="text-xs">
                  {project.difficultyLabel}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {project.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs">{getDifficultyStars(project.difficulty)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-[#478CBF] hover:text-[#478CBF]/80"
                  >
                    Начать
                    <ArrowRight className="size-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {project.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

function WhyThisCourseSection() {
  const features = [
    {
      icon: <BookOpen className="size-6 text-[#478CBF]" />,
      title: "Anti-Tutorial-Hell",
      description:
        "Никаких копипаст-туториалов. Каждый проект требует самостоятельного решения задач и архитектурных выборов.",
    },
    {
      icon: <Cpu className="size-6 text-[#45B853]" />,
      title: "GDScript → C++",
      description:
        "Единственный курс, где ты перейдёшь от GDScript к GDExtension на C++. Реальный путь к профессиональной разработке.",
    },
    {
      icon: <Layers className="size-6 text-purple-400" />,
      title: "Architecture-First",
      description:
        "Сначала архитектура, потом код. Изучишь паттерны: ECS, MVC, Observer — и применишь их в реальных проектах.",
    },
    {
      icon: <Zap className="size-6 text-yellow-500" />,
      title: "Интерактивная платформа",
      description:
        "Отслеживай прогресс, получай достижения и соревнуйся с другими. Платформа мотивирует продолжать обучение.",
    },
  ];

  return (
    <section className="px-4 md:px-6 py-16 max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight">Почему этот курс?</h2>
        <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
          Мы создали курс, который реально готовит к разработке игр, а не к
          повторению туториалов.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        {features.map((feature) => (
          <Card key={feature.title} className="transition-colors hover:border-[#478CBF]/30">
            <CardHeader className="pb-2">
              <div className="mb-2">{feature.icon}</div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function TechStackSection() {
  const technologies = [
    { name: "Godot Engine", icon: <Gamepad2 className="size-8 text-[#478CBF]" />, desc: "Игровой движок" },
    { name: "GDScript", icon: <Code className="size-8 text-[#45B853]" />, desc: "Скриптовый язык" },
    { name: "C++ / GDExtension", icon: <Wrench className="size-8 text-purple-400" />, desc: "Нативная производительность" },
    { name: "Git", icon: <Layers className="size-8 text-orange-400" />, desc: "Контроль версий" },
  ];

  return (
    <section className="px-4 md:px-6 py-16 max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight">Технологии</h2>
        <p className="mt-2 text-muted-foreground">
          Стек, который ты освоишь в процессе обучения
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {technologies.map((tech) => (
          <Card key={tech.name} className="flex flex-col items-center justify-center py-6 transition-colors hover:border-[#478CBF]/30">
            {tech.icon}
            <h3 className="mt-3 font-semibold text-sm">{tech.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{tech.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <ProjectsSection />
      <WhyThisCourseSection />
      <TechStackSection />

      {/* CTA Section */}
      <section className="px-4 md:px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Готов начать?</h2>
          <p className="mt-3 text-muted-foreground">
            Присоединяйся к курсу бесплатно и начни создавать игры уже сегодня.
          </p>
          <Link href="/learn" className="inline-block mt-6">
            <Button size="lg" className="gap-2 bg-[#478CBF] hover:bg-[#478CBF]/80 text-white px-8">
              Начать обучение
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
