import { prisma } from "@/lib/prisma";

export const fetchArticleByQuery = async (searchText: string, skip: number, take: number) => {
  const [articles, total] = await prisma.$transaction([
    prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: searchText, mode: 'insensitive' } },
          { category: { contains: searchText, mode: 'insensitive' } },
        ],
      },
      include: {
        author: {
          select: { name: true, image: true, email: true },
        },
      },
      skip: skip,
      take: take,
    }),
    prisma.post.count({
      where: {
        OR: [
          { title: { contains: searchText, mode: 'insensitive' } },
          { category: { contains: searchText, mode: 'insensitive' } },
        ],
      },
    }),
  ]);

  return { articles, total };
};