"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { toast } from "../../../../src/lib/notify";
import {
  BookOpen,
  ExternalLink,
  LifeBuoy,
  Mail,
  MessageSquareWarning,
  Rocket,
} from "lucide-react";

import { Badge } from "../../../../src/components/ui/badge";
import { Button } from "../../../../src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../src/components/ui/card";
import { Input } from "../../../../src/components/ui/input";
import { Label } from "../../../../src/components/ui/label";
import { Textarea } from "../../../../src/components/ui/textarea";

const RESOURCES = [
  {
    title: "Base de connaissances Hummind",
    description:
      "Guides rapides pour les comptes, la gestion des organisations, les parcours et les notifications.",
    href: "https://support.hummind.com",
    icon: BookOpen,
  },
  {
    title: "Statut des services",
    description:
      "Verifiez en temps reel la disponibilite de la plateforme et des services relies.",
    href: "https://status.hummind.com",
    icon: Rocket,
  },
  {
    title: "Projet support Hummind",
    description:
      "Suivez les demandes en cours et l'avancement avec l'equipe support Hummind.",
    href: "https://support.hummind.com/projects",
    icon: LifeBuoy,
  },
];

const FREQUENT_NEEDS = [
  "Probleme d'acces au compte",
  "Erreur de droits organisation",
  "Question sur les notifications",
  "Incident technique sur un module",
];

const SUPPORT_EMAIL = "support@hummind.com";

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name || !email || !subject || !message) {
      toast.error("Merci de remplir tous les champs du formulaire.");
      return;
    }

    const content = [
      `Nom: ${name}`,
      `Email: ${email}`,
      "",
      "Contexte:",
      message,
    ].join("\n");

    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      `[Support Hummind] ${subject}`
    )}&body=${encodeURIComponent(content)}`;

    window.location.href = mailto;
    toast.success("Votre demande est prete a etre envoyee.");
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-5 md:px-6 md:py-6">
      <header className="rounded-xl border bg-card px-5 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="rounded-full px-3 py-1">Support Hummind</Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1">
            Projet support actif
          </Badge>
        </div>
        <h1 className="mt-3 text-2xl font-semibold">Centre d&apos;aide et support</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Retrouvez les ressources utiles et contactez l&apos;equipe support Hummind
          en quelques minutes pour un traitement plus rapide.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {RESOURCES.map((resource) => (
          <Card key={resource.title} className="gap-4">
            <CardHeader className="gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <resource.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">{resource.title}</CardTitle>
              <CardDescription>{resource.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href={resource.href} target="_blank" rel="noreferrer">
                  Ouvrir la ressource
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
        <Card className="gap-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquareWarning className="h-5 w-5" />
              Besoins frequents
            </CardTitle>
            <CardDescription>
              Selectionnez un sujet dans votre message pour accelerer le tri du
              ticket.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {FREQUENT_NEEDS.map((need) => (
              <div
                key={need}
                className="rounded-lg border border-border/70 px-3 py-2 text-sm"
              >
                {need}
              </div>
            ))}
            <div className="rounded-lg border border-dashed border-border/70 px-3 py-3 text-xs text-muted-foreground">
              Contact direct:{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium underline">
                {SUPPORT_EMAIL}
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-5 w-5" />
              Formulaire de contact
            </CardTitle>
            <CardDescription>
              Decrivez votre besoin. Le formulaire pre-remplit un email pour le
              projet support Hummind.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="support-name">Nom complet</Label>
                  <Input
                    id="support-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ex: Marie Dupont"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Email professionnel</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="vous@organisation.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-subject">Sujet</Label>
                <Input
                  id="support-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Ex: Incident sur la gestion des acces"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-message">Message</Label>
                <Textarea
                  id="support-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Expliquez le contexte, les etapes pour reproduire et l'impact."
                  className="min-h-40"
                  required
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="w-full sm:w-auto">
                  Envoyer au support
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

