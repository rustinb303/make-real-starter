'use client'

import dynamic from 'next/dynamic'
import '@tldraw/tldraw/tldraw.css'
import { MakeRealButton } from './components/MakeRealButton'
import { TldrawLogo } from './components/TldrawLogo'
import { RiskyButCoolAPIKeyInput } from './components/RiskyButCoolAPIKeyInput'
import { PreviewShapeUtil } from './PreviewShape/PreviewShape';
import { useState } from 'react';

const Tldraw = dynamic(async () => (await import('@tldraw/tldraw')).Tldraw, {
	ssr: false,
})

const shapeUtils = [PreviewShapeUtil]

export default function App() {
	const [selectedModel, setSelectedModel] = useState('gemini-1.5-pro');
	const models = [
		{ value: 'gemini-1.5-pro', label: 'Gemini Pro' },
		{ value: 'gemini-flash', label: 'Gemini Flash' },
	];
	return (
		<div className="editor">
		<select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
			{models.map((model) => (
				<option key={model.value} value={model.value}>{model.label}</option>
			))}
		</select>
			<Tldraw persistenceKey="make-real" shareZone={<MakeRealButton selectedModel={selectedModel} />} shapeUtils={shapeUtils}>
				<TldrawLogo />
				<RiskyButCoolAPIKeyInput />
			</Tldraw>
		</div>
	)
}

