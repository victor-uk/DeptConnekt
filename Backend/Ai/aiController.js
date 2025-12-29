import { getUser } from "../helpers/getUser.js";
import { AiService } from "./aiService.js";
import { StatusCodes } from "http-status-codes";
import { InferenceClientError } from "@huggingface/inference";

export const textGenerationController = async (req, res) => {
  const { prompt } = req.body;
  const category = req.path.split("/")[1];
  const { role, id } = req.user
  const user = await getUser(role, id)
  const aiService = new AiService(`allenai/Olmo-3-7B-Instruct:publicai`);
  const text = await aiService.generateText(role, category, user.name, prompt)
  res.setHeader("Content-type", "text/event-stream")
  res.setHeader("Cache-control", "no-cache")
  res.setHeader("Connection", "keep-alive")

  try {
    for await (const chunk of text) {
      const content = chunk.choices[0].delta?.content
      if (content) {
        process.stdout.write(content)
        res.write(`data: ${JSON.stringify({ content })}\n\n`)
      }
    }
    res.end()

  } catch (error) {
    console.error("AI Error:", error)
    if (error instanceof InferenceClientError) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message, details: error })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message })
    }
  }
}

export const summariseTextController = async (req, res) => {
  const { prompt } = req.body;
  const { role, id } = req.user
  const user = await getUser(role, id)
  const aiService = new AiService(`allenai/Olmo-3-7B-Instruct:publicai`);
  const text = await aiService.summariseText(role, user.name, prompt)
  res.setHeader("Content-type", "text/event-stream")
  res.setHeader("Cache-control", "no-cache")
  res.setHeader("Connection", "keep-alive")

  try {
    for await (const chunk of text) {
      const content = chunk.choices[0].delta?.content
      if (content) {
        process.stdout.write(content)
        res.write(`data: ${JSON.stringify({ content })}\n\n`)
      }
    }
    res.end()

  } catch (error) {
    console.error("AI Error:", error)
    if (error instanceof InferenceClientError) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message, details: error })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message })
    }
  }

}



