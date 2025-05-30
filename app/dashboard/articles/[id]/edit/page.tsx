import EditArticlePage from '@/components/articles/edit-article-page'
import { prisma } from '@/lib/prisma'
import React from 'react'

type EditArticlePageProps = {
    params:Promise<{id: string}>
}

const page : React.FC<EditArticlePageProps> = async ({params}) => {
    const id = (await params).id;
    const article = await prisma.post.findUnique({
        where: { id },
    })
    if(!article) return <h1>Article not found for this {id}</h1>

  return (
    <div>
        <EditArticlePage article={article}/>
    </div>
  )
}

export default page