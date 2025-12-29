import client from "./hfConfig.js";
import { InferenceClientError } from "@huggingface/inference";
import { BadRequestError } from "../utils/Error.js";

const textGenContext = "You are an academic assistant of the department of software engineering, FUTO. Help the user generate formal and professional responses. Do not use any offensive or obscene term"
const summaryContext = "You are a summary engine. Summarise the following text"
const PROMPT_MAX_SIZE = 1500
const TEXT_MAX_SIZE = 2500

export class AiService {
    constructor(model) {
        this.client = client
        this.model = model
    }

    textGenerationBuilder = (role, category, name, prompt) => {
        if (!prompt || prompt.length > PROMPT_MAX_SIZE) {
            throw new BadRequestError("Prompt is required and must be less than 1500 characters");
        }
        return `Create a/an ${category} from the following prompt: ${prompt}. My name is ${name}. I am a ${role}. Include my name.`
    }

    summariseTextBuilder = (role, name, prompt) => {
        if (!prompt || prompt.length > TEXT_MAX_SIZE) {
            throw new BadRequestError("Prompt is required and must be less than 2500 characters");
        }
        return `My name is ${name}. I am a ${role}. Summarise the following text: ${prompt}`
    }

    generateText = async (role, category, name, prompt, options = { m_n_t: 1024, temp: .7, top_p: .9, top_k: 50, r_p: 1.2 }) => {
        return this.client.chatCompletionStream({
            model: this.model,
            messages: [
                { role: "system", content: textGenContext },
                { role: "user", content: this.textGenerationBuilder(role, category, name, prompt) }
            ],
            max_tokens: options.m_n_t, // Map m_n_t to max_tokens
            temperature: options.temp,
            top_p: options.top_p,
            repetition_penalty: options.r_p
        })
    }

    summariseText = async (role, name, prompt, options = { m_n_t: 1024 }) => {
        return this.client.chatCompletionStream({
            model: this.model,
            messages: [
                { role: "system", content: summaryContext },
                { role: "user", content: this.summariseTextBuilder(role, name, prompt) }
            ],
            max_tokens: options.m_n_t
        })
    }

}