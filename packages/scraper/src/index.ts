import { createClient } from '@supabase/supabase-js';
import { ActivityClassifier } from '@agendaviva/agent';
import { slugify } from '@agendaviva/shared/validators';
import type { FontScraping, ClassificationOutput } from '@agendaviva/shared/types';
import * as dotenv from 'dotenv';

dotenv.config();

export class Scraper {
  private supabase;
  private classifier: ActivityClassifier;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!supabaseUrl || !supabaseKey || !openaiKey) {
      throw new Error('Missing required environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.classifier = new ActivityClassifier(openaiKey);
  }

  async run() {
    console.log('Starting scraper...');

    // Get active sources from database
    const { data: sources, error } = await this.supabase
      .from('fonts_scraping')
      .select('*')
      .eq('activa', true);

    if (error) {
      console.error('Error fetching sources:', error);
      return;
    }

    if (!sources || sources.length === 0) {
      console.log('No active scraping sources found');
      return;
    }

    console.log(`Found ${sources.length} active sources`);

    for (const source of sources) {
      await this.scrapeSource(source as FontScraping);
    }

    console.log('Scraping completed');
  }

  private async scrapeSource(source: FontScraping) {
    console.log(`Scraping source: ${source.nom} (${source.tipus})`);

    try {
      let activities: string[] = [];

      switch (source.tipus) {
        case 'web':
          activities = await this.scrapeWeb(source);
          break;
        case 'instagram':
          console.log('Instagram scraping not yet implemented');
          break;
        case 'api':
          console.log('API scraping not yet implemented');
          break;
        default:
          console.log(`Unsupported source type: ${source.tipus}`);
      }

      // Classify and store activities
      for (const activityText of activities) {
        await this.processActivity(activityText, source);
      }

      // Update last_scraped timestamp
      await this.supabase
        .from('fonts_scraping')
        .update({ last_scraped: new Date().toISOString(), last_error: null })
        .eq('id', source.id);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error scraping ${source.nom}:`, errorMsg);

      // Update error in database
      await this.supabase
        .from('fonts_scraping')
        .update({ last_error: errorMsg })
        .eq('id', source.id);
    }
  }

  private async scrapeWeb(source: FontScraping): Promise<string[]> {
    // This is a placeholder - actual implementation would use cheerio to parse HTML
    console.log(`Web scraping not fully implemented for ${source.url}`);
    return [];
  }

  private async processActivity(text: string, source: FontScraping) {
    try {
      // Classify with AI
      const classification = await this.classifier.classify({
        text,
        context: { source: source.nom, url: source.url }
      });

      // Generate slug
      const slug = slugify(classification.nom);

      // Check if activity already exists
      const { data: existing } = await this.supabase
        .from('activitats')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) {
        console.log(`Activity already exists: ${classification.nom}`);
        return;
      }

      // Insert into database
      const activitat = {
        nom: classification.nom,
        slug,
        descripcio: classification.descripcio,
        tipologies: classification.tipologies,
        tipologia_principal: classification.tipologia_principal,
        subtipologia: classification.subtipologia,
        quan_es_fa: classification.quan_es_fa,
        edat_min: classification.edat_min,
        edat_max: classification.edat_max,
        edat_text: classification.edat_text,
        municipi: classification.municipi,
        barri_zona: classification.barri_zona,
        dies: classification.dies,
        horari: classification.horari,
        preu: classification.preu,
        tags: classification.tags,
        nd_score: classification.nd_score,
        nd_nivell: classification.nd_nivell,
        nd_justificacio: classification.nd_justificacio,
        nd_indicadors_positius: classification.nd_indicadors_positius,
        nd_indicadors_negatius: classification.nd_indicadors_negatius,
        nd_recomanacions: classification.nd_recomanacions,
        nd_confianca: classification.nd_confianca,
        nd_verificat_per: 'inferit' as const,
        confianca_global: classification.confianca_global,
        estat: 'pendent' as const,
        font_url: source.url,
        font_text: text,
        last_scraped: new Date().toISOString(),
        created_by: 'agent'
      };

      const { error } = await this.supabase
        .from('activitats')
        .insert(activitat);

      if (error) {
        console.error('Error inserting activity:', error);
        return;
      }

      console.log(`Activity created: ${classification.nom}`);

      // Add to review queue if confidence is low
      if (classification.confianca_global < 70 || classification.nd_confianca < 60) {
        await this.addToReviewQueue(classification, activitat.slug);
      }

    } catch (error) {
      console.error('Error processing activity:', error);
    }
  }

  private async addToReviewQueue(classification: ClassificationOutput, slug: string) {
    const { data: activitat } = await this.supabase
      .from('activitats')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!activitat) return;

    const motiu_detall: Record<string, any> = {};
    
    if (classification.confianca_global < 70) {
      motiu_detall.confianca_baixa = true;
    }
    if (classification.nd_confianca < 60) {
      motiu_detall.nd_pocs_indicadors = true;
    }

    await this.supabase
      .from('cua_revisio')
      .insert({
        activitat_id: activitat.id,
        prioritat: classification.confianca_global < 50 ? 'alta' : 'mitjana',
        motiu: 'Confiança baixa en classificació automàtica',
        motiu_detall,
        temps_estimat_minuts: 3
      });
  }
}
