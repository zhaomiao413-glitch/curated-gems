#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tag Management System for RSS Analyzer

This script helps manage and standardize tags to prevent tag proliferation.
It provides predefined tag categories and mapping functions.
"""

import json
import re
from typing import List, Dict, Set

# Predefined tag categories - limit to essential categories
PREDEFINED_TAGS = {
    # Technology & Development
    'technology': ['tech', 'software', 'programming', 'development', 'ai', 'machine learning', 'data'],
    'programming': ['coding', 'software development', 'programming languages', 'algorithms'],
    
    # Business & Entrepreneurship
    'business': ['entrepreneurship', 'startups', 'leadership', 'management', 'strategy'],
    'entrepreneurship': ['startups', 'founders', 'scaling', 'venture capital', 'innovation'],
    
    # Personal Development
    'productivity': ['efficiency', 'time management', 'habits', 'focus', 'organization'],
    'creativity': ['ideas', 'innovation', 'design', 'art', 'inspiration'],
    'learning': ['education', 'knowledge', 'skills', 'growth', 'reading'],
    
    # Communication & Relationships
    'communication': ['writing', 'speaking', 'presentation', 'storytelling'],
    'relationships': ['friendship', 'networking', 'collaboration', 'community'],
    
    # Philosophy & Thinking
    'philosophy': ['ethics', 'morality', 'values', 'meaning', 'purpose'],
    'thinking': ['critical thinking', 'decision making', 'problem solving', 'analysis'],
    
    # Lifestyle & Personal
    'lifestyle': ['health', 'wellness', 'travel', 'culture', 'personal'],
    'psychology': ['mental health', 'behavior', 'motivation', 'emotions']
}

# Reverse mapping for quick lookup
TAG_MAPPING = {}
for main_tag, related_tags in PREDEFINED_TAGS.items():
    TAG_MAPPING[main_tag] = main_tag
    for related_tag in related_tags:
        TAG_MAPPING[related_tag] = main_tag

def normalize_tag(tag: str) -> str:
    """Normalize a single tag to lowercase and clean format"""
    return tag.lower().strip().replace('_', ' ')

def map_to_standard_tag(tag: str) -> str:
    """Map a tag to its standard category"""
    normalized = normalize_tag(tag)
    
    # Direct mapping
    if normalized in TAG_MAPPING:
        return TAG_MAPPING[normalized]
    
    # Enhanced fuzzy matching with keyword detection
    keyword_mappings = {
        'business': ['startup', 'entrepreneur', 'company', 'market', 'revenue', 'profit', 'customer'],
        'technology': ['tech', 'software', 'code', 'programming', 'algorithm', 'data', 'ai', 'digital'],
        'learning': ['knowledge', 'education', 'study', 'research', 'insight', 'understanding', 'wisdom'],
        'creativity': ['idea', 'innovation', 'design', 'creative', 'imagination', 'inspiration', 'original'],
        'communication': ['writing', 'speaking', 'language', 'expression', 'message', 'story', 'narrative'],
        'thinking': ['thought', 'reasoning', 'logic', 'analysis', 'critical', 'decision', 'problem'],
        'philosophy': ['truth', 'meaning', 'purpose', 'ethics', 'moral', 'value', 'belief', 'wisdom'],
        'productivity': ['efficiency', 'performance', 'optimization', 'habit', 'focus', 'goal', 'achievement'],
        'relationships': ['friendship', 'connection', 'network', 'social', 'community', 'collaboration'],
        'psychology': ['behavior', 'emotion', 'motivation', 'mental', 'mind', 'cognitive', 'perception']
    }
    
    # Check keyword mappings
    for category, keywords in keyword_mappings.items():
        for keyword in keywords:
            if keyword in normalized or normalized in keyword:
                return category
    
    # Fuzzy matching for common variations
    for standard_tag, mapped_tag in TAG_MAPPING.items():
        if normalized in standard_tag or standard_tag in normalized:
            return mapped_tag
    
    # If no mapping found, check if it's a core category
    if normalized in PREDEFINED_TAGS:
        return normalized
    
    # For unmapped tags, try to categorize based on common patterns
    if any(word in normalized for word in ['work', 'career', 'job', 'professional']):
        return 'productivity'
    elif any(word in normalized for word in ['life', 'personal', 'self', 'individual']):
        return 'lifestyle'
    elif any(word in normalized for word in ['growth', 'development', 'improvement', 'progress']):
        return 'learning'
    
    # Return original if no mapping found (but this should be rare now)
    return normalized

def standardize_tags(tags: List[str], max_tags: int = 3) -> List[str]:
    """Standardize a list of tags and limit to max_tags"""
    if not tags:
        return []
    
    # Map all tags to standard categories
    mapped_tags = [map_to_standard_tag(tag) for tag in tags]
    
    # Remove duplicates while preserving order
    seen = set()
    unique_tags = []
    for tag in mapped_tags:
        if tag not in seen:
            seen.add(tag)
            unique_tags.append(tag)
    
    # Limit to max_tags
    return unique_tags[:max_tags]

def get_tag_suggestions(content: str, title: str = "") -> List[str]:
    """Suggest tags based on content analysis"""
    text = (title + " " + content).lower()
    suggested = []
    
    # Check for keywords that map to our predefined categories
    for main_tag, related_tags in PREDEFINED_TAGS.items():
        # Check main tag
        if main_tag in text:
            suggested.append(main_tag)
            continue
            
        # Check related tags
        for related_tag in related_tags:
            if related_tag in text:
                suggested.append(main_tag)
                break
    
    return list(set(suggested))[:3]  # Return unique suggestions, max 3

def update_prompt_with_predefined_tags() -> str:
    """Generate updated prompt text with predefined tags"""
    tag_list = list(PREDEFINED_TAGS.keys())
    tag_str = ", ".join(tag_list)
    
    return f"""- "tags": Choose 3 keyword tags from the following predefined categories: {tag_str}. If the content doesn't fit these categories well, you may use up to 1 custom tag, but prefer the predefined ones. Return as a list (array), all in lowercase English characters."""

if __name__ == "__main__":
    # Test the functions
    test_tags = ["artificial intelligence", "machine learning", "startup", "leadership", "creativity"]
    print("Original tags:", test_tags)
    print("Standardized tags:", standardize_tags(test_tags))
    
    print("\nPredefined tag categories:")
    for category in PREDEFINED_TAGS.keys():
        print(f"- {category}")
    
    print("\nUpdated prompt:")
    print(update_prompt_with_predefined_tags())