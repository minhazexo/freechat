<?php

namespace App\Services;

class ModerationService
{
    protected array $badWords;
    protected array $sensitivePatterns;

    public function __construct()
    {
        $this->badWords = config('moderation.bad_words', []);
        $this->sensitivePatterns = config('moderation.sensitive_patterns', []);
    }

    public function checkContent(string $content): array
    {
        $flagged = [];
        $isClean = true;
        $censoredContent = $content;

        // Check for bad words
        $lowerContent = strtolower($content);
        foreach ($this->badWords as $word) {
            if (stripos($lowerContent, strtolower($word)) !== false) {
                $flagged[] = ['type' => 'profanity', 'match' => $word];
                $isClean = false;
                $censoredContent = $this->censorWord($censoredContent, $word);
            }
        }

        // Check for sensitive patterns (PII)
        foreach ($this->sensitivePatterns as $type => $pattern) {
            if (preg_match($pattern, $content, $matches)) {
                $flagged[] = ['type' => 'pii', 'match' => $type];
                $isClean = false;
            }
        }

        // Check for excessive caps (shouting)
        $letters = preg_replace('/[^a-zA-Z]/', '', $content);
        if (strlen($letters) > 10) {
            $upperCount = strlen(preg_replace('/[^A-Z]/', '', $letters));
            $capsRatio = $upperCount / strlen($letters);
            if ($capsRatio > 0.7) {
                $flagged[] = ['type' => 'excessive_caps', 'match' => 'Excessive capitalization'];
            }
        }

        // Check for spam patterns (repeated characters)
        if (preg_match('/(.)\1{4,}/', $content)) {
            $flagged[] = ['type' => 'spam_pattern', 'match' => 'Repeated characters'];
            $isClean = false;
        }

        return [
            'isClean' => $isClean,
            'flagged' => $flagged,
            'censoredContent' => $censoredContent,
            'originalContent' => $content,
        ];
    }

    public function censorWord(string $content, string $word): string
    {
        $replacement = str_repeat('*', strlen($word));
        return str_ireplace($word, $replacement, $content);
    }

    public function filterContent(string $content): string
    {
        $result = $this->checkContent($content);
        return $result['censoredContent'];
    }

    public function isClean(string $content): bool
    {
        return $this->checkContent($content)['isClean'];
    }

    public function addBadWord(string $word): void
    {
        $this->badWords[] = strtolower($word);
        $this->badWords = array_unique($this->badWords);
    }

    public function removeBadWord(string $word): void
    {
        $this->badWords = array_diff($this->badWords, [strtolower($word)]);
    }

    public function getBadWords(): array
    {
        return $this->badWords;
    }

    public function setBadWords(array $words): void
    {
        $this->badWords = array_map('strtolower', $words);
    }
}
